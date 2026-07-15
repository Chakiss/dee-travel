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
// Real places copied from production (read-only) so dev shows real cover images
// served from the public prod bucket. Kept small; content trimmed.
const places = [
  {
    id: '0Afeio4LTMhNXL73trKL',
    name: 'วัดใต้พระเจ้าใหญ่องค์ตื้อ',
    slug: 'wat-tai-phra-chao-yai-ong-tue',
    excerpt: 'พระพุทธรูปที่งดงามเป็นพระประธานองค์ศักดิ์สิทธิ์',
    cover: '/images/places/0Afeio4LTMhNXL73trKL/cover',
    position: new GeoPoint(15.2272229, 104.8653227),
    featured: true,
  },
  {
    id: '0CySwELJXDW1X6vqrFhB',
    name: 'น้ำตกแสงจันทร์',
    slug: 'num-tok-sangjan',
    excerpt: 'น้ำตกกลางป่าที่แสงอาทิตย์ลอดผ่านช่องหินเป็นลำแสงงดงาม',
    cover: '/images/places/0CySwELJXDW1X6vqrFhB/cover',
    featured: true,
  },
  {
    id: '0Qg3SdXgGs32NPWo1Tb0',
    name: 'วนอุทยานน้ำตกบ๋าหลวง',
    slug: 'ba-luang-waterfall-forest-park',
    excerpt: 'วนอุทยานน้ำตกบ๋าหลวง ธรรมชาติร่มรื่นเหมาะแก่การพักผ่อน',
    cover: '/images/places/0Qg3SdXgGs32NPWo1Tb0/cover',
    featured: false,
  },
  {
    id: '0SHslGaXPrrh7x7jETii',
    name: 'ศาลหลักเมืองสุรินทร์',
    slug: 'city-pillar-shrine',
    excerpt: 'การผสมผสานระหว่างศิลปะไทยและศิลปะเขมรอย่างลงตัว',
    cover: '/images/places/0SHslGaXPrrh7x7jETii/cover',
    featured: false,
  },
  {
    id: '0QVrwidxHfWQBgKBeARt',
    name: 'ตำบลเมืองลีง',
    slug: 'sao-muangleeng-surin',
    excerpt: 'ความสวยงามของธรรมชาติ และวิถีชีวิตที่มีเอกลักษณ์',
    cover: '/images/places/0QVrwidxHfWQBgKBeARt/cover',
    featured: false,
  },
  {
    id: '0d1Zp6owlQMsFUrY038G',
    name: 'ผ้าทอบ้านกระชาย',
    slug: 'ban-krachai-silk-weaving',
    excerpt: 'ผ้าไหมลายโครมห้า และผ้ามัดหมี่ งานหัตถกรรมพื้นถิ่น',
    cover: '/images/places/0d1Zp6owlQMsFUrY038G/cover',
    featured: false,
  },
].map((p) => ({
  ...p,
  content: `<p>${p.excerpt}</p>`,
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
await seedCollection('categories', categories)
await seedCollection('places', places)

// Read-back — confirms writes landed and published-content queries work.
const published = await db.collection('places').where('status', '==', 'published').get()
console.log(`Read-back: ${published.size} published places -> ${published.docs.map((d) => d.get('name')).join(', ')}`)
console.log('Done.')
process.exit(0)
