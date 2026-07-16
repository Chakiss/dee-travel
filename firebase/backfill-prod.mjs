/**
 * PRODUCTION backfill — ADDITIVE only. Adds the new-schema fields to the existing
 * live docs without overwriting or deleting anything:
 *   places  += status='published', publishedAt, provinceId/Name, districtId/Name
 *   articles/events += status='published', publishedAt
 *
 * Safe for the currently-live legacy site (extra fields are ignored by old code).
 * Uses the Firestore REST :commit with an updateMask limited to the new fields
 * (merge), authenticated by a gcloud access token (env TOKEN). Backup first.
 *
 * DRY RUN by default. Pass --commit to actually write to production.
 */
const PROJECT = 'deetravel-project'
const TOKEN = process.env.TOKEN
const COMMIT = process.argv.includes('--commit')
if (!TOKEN) { console.error('Missing TOKEN'); process.exit(1) }
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

const refId = (rv) => (rv ? String(rv).split('/').pop() : null)
function conv(v) {
  const [t, val] = Object.entries(v)[0]
  if (t === 'stringValue' || t === 'booleanValue') return val
  if (t === 'timestampValue') return val
  if (t === 'referenceValue') return { __ref: refId(val) }
  if (t === 'arrayValue') return (val.values || []).map(conv)
  if (t === 'mapValue') return Object.fromEntries(Object.entries(val.fields || {}).map(([k, x]) => [k, conv(x)]))
  return null
}
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, conv(v)]))

async function fetchAll(collection) {
  const out = []
  let pageToken = ''
  do {
    const res = await fetch(`${BASE}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, { headers: auth })
    if (!res.ok) throw new Error(`read ${collection}: ${res.status}`)
    const data = await res.json()
    for (const doc of data.documents || []) out.push({ ...fields(doc.fields || {}), id: doc.name.split('/').pop() })
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return out
}

const [provinces, districts, places, articles, events] =
  await Promise.all(['provinces', 'districts', 'places', 'articles', 'events'].map(fetchAll))
const provMap = new Map(provinces.map((p) => [p.id, p.name]))
const distMap = new Map(districts.map((d) => [d.id, d.name]))

const nowIso = new Date().toISOString()
const ts = (v) => (typeof v === 'string' ? v : nowIso)

// Build the additive write for one content doc.
function additive(collection, doc) {
  const set = { status: { stringValue: 'published' }, publishedAt: { timestampValue: ts(doc.createdAt) } }
  const mask = ['status', 'publishedAt']
  if (collection === 'places' || collection === 'events') {
    const provId = doc.province && doc.province.__ref
    const distId = doc.district && doc.district.__ref
    if (provId) { set.provinceId = { stringValue: provId }; mask.push('provinceId') }
    if (provId && provMap.get(provId)) { set.provinceName = { stringValue: provMap.get(provId) }; mask.push('provinceName') }
    if (distId) { set.districtId = { stringValue: distId }; mask.push('districtId') }
    if (distId && distMap.get(distId)) { set.districtName = { stringValue: distMap.get(distId) }; mask.push('districtName') }
  }
  return {
    update: { name: `projects/${PROJECT}/databases/(default)/documents/${collection}/${doc.id}`, fields: set },
    updateMask: { fieldPaths: mask },
  }
}

async function commitBatch(writes) {
  const res = await fetch(`${BASE}:commit`, { method: 'POST', headers: auth, body: JSON.stringify({ writes }) })
  if (!res.ok) throw new Error(`commit: ${res.status} ${await res.text()}`)
}

async function run(collection, docs) {
  const writes = docs.map((d) => additive(collection, d))
  if (!COMMIT) return writes.length
  for (let i = 0; i < writes.length; i += 400) {
    await commitBatch(writes.slice(i, i + 400))
    process.stdout.write(`\r  ${collection}: ${Math.min(i + 400, writes.length)}/${writes.length}`)
  }
  process.stdout.write('\n')
  return writes.length
}

console.log(`Mode: ${COMMIT ? '*** COMMIT (writing to PRODUCTION) ***' : 'DRY RUN (no writes)'}`)
console.log(`Read: places ${places.length}, articles ${articles.length}, events ${events.length}`)
console.log('Sample place additive write:')
console.log('  ', JSON.stringify(additive('places', places[0]), null, 0).slice(0, 260))
const pc = await run('places', places)
const ac = await run('articles', articles)
const ec = await run('events', events)
console.log(`${COMMIT ? 'Wrote' : 'Would write'}: places ${pc}, articles ${ac}, events ${ec} (additive, updateMask-scoped)`)
process.exit(0)
