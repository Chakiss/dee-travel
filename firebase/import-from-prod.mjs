/**
 * Staging import + migration: read the REAL production Firestore (READ-ONLY),
 * migrate it to the new schema, and write into the local EMULATOR.
 *
 * Migration applied (additive — matches the target schema):
 *  - content (places/articles/events) gets status='published' + publishedAt
 *  - places/events get denormalised provinceId/provinceName/districtId/districtName
 *    (resolved from the legacy reference fields)
 *  - reference fields (province/district/geography/category) reduced to plain ids
 *
 * Reads prod via REST with a gcloud access token (env TOKEN); writes the emulator
 * via firebase-admin (needs FIRESTORE_EMULATOR_HOST). Never writes to prod.
 * This same mapping is what a real prod backfill would apply.
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const PROJECT = 'deetravel-project'
const TOKEN = process.env.TOKEN
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Refusing to run: FIRESTORE_EMULATOR_HOST not set (would target the cloud).')
  process.exit(1)
}
if (!TOKEN) {
  console.error('Missing TOKEN (gcloud access token) for reading prod.')
  process.exit(1)
}
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

const refId = (rv) => (rv ? String(rv).split('/').pop() : null)
function conv(v) {
  const [t, val] = Object.entries(v)[0]
  switch (t) {
    case 'stringValue': return val
    case 'booleanValue': return val
    case 'integerValue': return Number(val)
    case 'doubleValue': return val
    case 'timestampValue': return new Date(val)
    case 'geoPointValue': return { __geo: true, lat: val.latitude, lng: val.longitude }
    case 'referenceValue': return { __ref: refId(val) }
    case 'arrayValue': return (val.values || []).map(conv)
    case 'mapValue': return convFields(val.fields || {})
    default: return null
  }
}
const convFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, conv(v)]))

async function fetchAll(collection) {
  const out = []
  let pageToken = ''
  do {
    const url = `${BASE}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
    if (!res.ok) throw new Error(`read ${collection}: ${res.status}`)
    const data = await res.json()
    for (const doc of data.documents || []) {
      // Real doc id LAST so a stray `id` field in the data can't override it.
      out.push({ ...convFields(doc.fields || {}), id: doc.name.split('/').pop() })
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return out
}

initializeApp({ projectId: 'demo-deetravel' })
const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })
const now = Timestamp.now()

console.log('Reading production (read-only)…')
const [geographies, provinces, districts, subdistricts, categories, places, articles, events] =
  await Promise.all(['geographies', 'provinces', 'districts', 'subdistricts', 'categories', 'places', 'articles', 'events'].map(fetchAll))
console.log(`  geo ${geographies.length}/${provinces.length}/${districts.length}/${subdistricts.length}, cat ${categories.length}, places ${places.length}, articles ${articles.length}, events ${events.length}`)

// Lookup maps
const provMap = new Map(provinces.map((p) => [p.id, p]))
const distMap = new Map(districts.map((d) => [d.id, d]))

const geoPoint = (v) => (v && v.__geo ? new GeoPoint(v.lat, v.lng) : undefined)
const ids = (arr) => (Array.isArray(arr) ? arr.map((x) => (x && x.__ref) || x).filter(Boolean) : [])

function migrateContent(doc, opts = {}) {
  const provId = doc.province && doc.province.__ref
  const distId = doc.district && doc.district.__ref
  const geoId = doc.geography && doc.geography.__ref
  const prov = provId && provMap.get(provId)
  const dist = distId && distMap.get(distId)
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    excerpt: doc.excerpt ?? '',
    content: doc.content ?? '',
    cover: doc.cover ?? '',
    category: ids(doc.category),
    format_address: doc.format_address,
    getting: doc.getting,
    phone: doc.phone,
    website: doc.website,
    position: geoPoint(doc.position),
    // geo denormalisation
    provinceId: provId || undefined,
    provinceName: prov ? prov.name : undefined,
    districtId: distId || undefined,
    districtName: dist ? dist.name : undefined,
    geographyId: geoId || undefined,
    // publishing workflow (additive) — legacy content is live
    status: 'published',
    createdAt: doc.createdAt ? Timestamp.fromDate(new Date(doc.createdAt)) : now,
    updatedAt: doc.updatedAt ? Timestamp.fromDate(new Date(doc.updatedAt)) : now,
    publishedAt: doc.createdAt ? Timestamp.fromDate(new Date(doc.createdAt)) : now,
    ...opts,
  }
}

async function writeAll(name, docs) {
  let written = 0
  let skipped = 0
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch()
    let n = 0
    for (const { id, ...data } of docs.slice(i, i + 400)) {
      if (!id || typeof id !== 'string') { skipped++; continue }
      batch.set(db.collection(name).doc(id), data)
      n++
    }
    if (n) await batch.commit()
    written += n
  }
  console.log(`  wrote ${name}: ${written}${skipped ? ` (skipped ${skipped} without id)` : ''}`)
}

console.log('Writing to emulator…')
await writeAll('geographies', geographies.map((g) => ({ id: g.id, name: g.name, slug: g.slug })))
await writeAll('provinces', provinces.map((p) => ({ id: p.id, name: p.name, slug: p.slug, geographyId: p.geography && p.geography.__ref })))
await writeAll('districts', districts.map((d) => ({ id: d.id, name: d.name, provinceId: d.province && d.province.__ref })))
await writeAll('subdistricts', subdistricts.map((s) => ({ id: s.id, name: s.name, districtId: s.district && s.district.__ref })))
await writeAll('categories', categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))
await writeAll('places', places.map((p) => migrateContent(p)))
await writeAll('articles', articles.map((a) => migrateContent(a)))
await writeAll('events', events.map((e) => migrateContent(e, { place: ids(e.place) })))

// Admin user for the CMS (same as seed.mjs)
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  const auth = getAuth()
  let user
  try { user = await auth.getUserByEmail('admin@deetravel.local') }
  catch { user = await auth.createUser({ email: 'admin@deetravel.local', password: 'dee12345', displayName: 'Dee Admin' }) }
  await auth.setCustomUserClaims(user.uid, { role: 'admin' })
  console.log('  auth: admin@deetravel.local (role=admin)')
}

// Read-back
const pub = await db.collection('places').where('status', '==', 'published').count().get()
console.log(`Read-back: ${pub.data().count} published places. Done.`)
process.exit(0)
