/**
 * Seed the local Firestore EMULATOR with a small, realistic sample.
 * Never touches the cloud — refuses to run unless FIRESTORE_EMULATOR_HOST is set.
 *
 * Usage: start the emulator, then `pnpm seed` (or `node firebase/seed.mjs`).
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not set (would hit the cloud).')
  process.exit(1)
}

initializeApp({ projectId: 'demo-deetravel' })
const db = getFirestore()
const now = Timestamp.now()

const geographies = [{ id: 'isan', name: 'ภาคตะวันออกเฉียงเหนือ', slug: 'isan' }]
const provinces = [{ id: 'ubon', name: 'อุบลราชธานี', slug: 'ubon-ratchathani', geography: 'geographies/isan' }]
const categories = [
  { id: 'temple', name: 'วัด', slug: 'temple' },
  { id: 'cafe', name: 'คาเฟ่', slug: 'cafe' },
]
const places = [
  {
    id: 'wat-tai',
    name: 'วัดใต้พระเจ้าใหญ่องค์ตื้อ',
    slug: 'wat-tai-phra-chao-yai-ong-tue',
    excerpt: 'พระพุทธรูปงดงาม พระประธานองค์ศักดิ์สิทธิ์กลางเมืองอุบล',
    content: '<p><strong>วัดใต้พระเจ้าใหญ่องค์ตื้อ</strong> เป็นวัดเก่าแก่คู่เมืองอุบลราชธานี</p>',
    cover: '/images/places/wat-tai/cover',
    category: ['categories/temple'],
    province: 'provinces/ubon',
    geography: 'geographies/isan',
    position: new GeoPoint(15.2272229, 104.8653227),
    status: 'published',
    featured: true,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  },
  {
    id: 'demo-cafe',
    name: 'คาเฟ่ริมมูล',
    slug: 'rim-mun-cafe',
    excerpt: 'จิบกาแฟชมวิวแม่น้ำมูลยามเย็น',
    content: '<p>คาเฟ่บรรยากาศดีริมแม่น้ำมูล เหมาะกับการพักผ่อน</p>',
    cover: '/images/places/demo-cafe/cover',
    category: ['categories/cafe'],
    province: 'provinces/ubon',
    geography: 'geographies/isan',
    position: new GeoPoint(15.21, 104.86),
    status: 'published',
    featured: false,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  },
]

async function seedCollection(name, docs) {
  const batch = db.batch()
  for (const { id, ...data } of docs) batch.set(db.collection(name).doc(id), data)
  await batch.commit()
  console.log(`  ${name}: ${docs.length} docs`)
}

console.log(`Seeding emulator at ${process.env.FIRESTORE_EMULATOR_HOST} ...`)
await seedCollection('geographies', geographies)
await seedCollection('provinces', provinces)
await seedCollection('categories', categories)
await seedCollection('places', places)

// Read-back — confirms writes landed and published-content queries work.
const published = await db.collection('places').where('status', '==', 'published').get()
console.log(`Read-back: ${published.size} published places -> ${published.docs.map((d) => d.get('name')).join(', ')}`)
console.log('Done.')
process.exit(0)
