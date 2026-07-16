/**
 * Seed the local Firestore EMULATOR with a small, realistic sample.
 * Never touches the cloud — refuses to run unless FIRESTORE_EMULATOR_HOST is set.
 *
 * Place records come from firebase/seed-data.json (real docs copied read-only
 * from production, so covers + content are genuine). Usage: start the emulator,
 * then `pnpm seed`.
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not set (would hit the cloud).')
  process.exit(1)
}

initializeApp({ projectId: 'demo-deetravel' })
const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })
const now = Timestamp.now()

const geographies = [{ id: 'isan', name: 'ภาคตะวันออกเฉียงเหนือ', slug: 'isan' }]
const categories = [
  { id: 'temple', name: 'วัด', slug: 'temple' },
  { id: 'nature', name: 'ธรรมชาติ', slug: 'nature' },
  { id: 'culture', name: 'วัฒนธรรม', slug: 'culture' },
]

// Real provinces/districts referenced by the seed places (plain strings, no refs).
const geo = JSON.parse(readFileSync(new URL('./geo-seed.json', import.meta.url)))
const provinces = geo.provinces.map((p) => ({ ...p, geography: 'geographies/isan' }))
const districts = geo.districts

const placesData = JSON.parse(readFileSync(new URL('./seed-data.json', import.meta.url)))
const places = placesData.map((p) => ({
  ...p,
  position: p.position ? new GeoPoint(p.position.lat, p.position.lng) : undefined,
  status: 'published',
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
}))

async function seedCollection(name, docs) {
  const batch = db.batch()
  for (const { id, ...data } of docs) batch.set(db.collection(name).doc(id), data)
  await batch.commit()
  console.log(`  ${name}: ${docs.length} docs`)
}

console.log(`Seeding emulator at ${process.env.FIRESTORE_EMULATOR_HOST} ...`)
await seedCollection('geographies', geographies)
await seedCollection('provinces', provinces)
await seedCollection('districts', districts)
await seedCollection('categories', categories)
await seedCollection('places', places)

// Read-back — confirms writes landed and published-content queries work.
const published = await db.collection('places').where('status', '==', 'published').get()
console.log(`Read-back: ${published.size} published places -> ${published.docs.map((d) => d.get('name')).join(', ')}`)
console.log('Done.')
process.exit(0)
