<script setup lang="ts">
import { getDocs, query, where } from 'firebase/firestore'
import type { Place } from '@deetravel/types'
import { PlaceCard } from '@deetravel/ui'

// Remount when the query changes so filters always reflect the URL.
definePageMeta({ key: (route) => route.fullPath })

const route = useRoute()
const { db, typedCollection, toPlain } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

useHead({ title: 'ค้นหาสถานที่ — Dee Travel' })

const province = computed(() => String(route.query.province ?? ''))
const district = computed(() => String(route.query.district ?? ''))
const keyword = computed(() => String(route.query.q ?? ''))

const { data: places } = await useAsyncData(
  'places-list',
  async () => {
    let qref = query(typedCollection(db, 'places'), where('status', '==', 'published'))
    if (province.value) qref = query(qref, where('provinceId', '==', province.value))

    const snap = await getDocs(qref)
    let list = snap.docs.map((d) => toPlain<Place>(d.data()))

    if (district.value) list = list.filter((p) => p.districtId === district.value)
    if (keyword.value) {
      const k = keyword.value.toLowerCase()
      list = list.filter((p) => `${p.name} ${p.excerpt ?? ''}`.toLowerCase().includes(k))
    }
    return list
  },
  { watch: [province, district, keyword] },
)

// Human-readable summary of the active filters (from the matched docs / query).
const summary = computed(() => {
  const parts: string[] = []
  const first = places.value?.[0]
  if (route.query.province) parts.push(first?.provinceName ?? 'จังหวัดที่เลือก')
  if (route.query.district) parts.push(first?.districtName ?? 'อำเภอที่เลือก')
  if (route.query.q) parts.push(`“${route.query.q}”`)
  return parts.join(' · ')
})
</script>

<template>
  <main class="wrap">
    <div class="dt-section-head">
      <p class="dt-eyebrow">DeeSearch</p>
      <h1 class="dt-title">ค้นหาสถานที่</h1>
      <hr class="dt-divider">
    </div>

    <div class="searchbox">
      <HeroSearch
        :province="String(route.query.province ?? '')"
        :district="String(route.query.district ?? '')"
        :q="String(route.query.q ?? '')"
      />
    </div>

    <p class="result">
      พบ <strong>{{ places?.length ?? 0 }}</strong> สถานที่<template v-if="summary"> · {{ summary }}</template>
    </p>

    <div class="grid">
      <NuxtLink
        v-for="p in places"
        :key="p.id"
        :to="`/places/${p.slug}`"
        class="card-link"
      >
        <PlaceCard :place="p" :bucket="imageBucket" />
      </NuxtLink>
    </div>

    <p v-if="!places?.length" class="empty">
      ไม่พบสถานที่ตามเงื่อนไข — ลองปรับตัวกรอง หรือ
      <NuxtLink to="/places" class="link">ดูทั้งหมด</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 5vh 24px 0; }
.searchbox { margin: 0 0 2rem; }
.result { text-align: center; color: var(--dt-muted); font-size: 0.95rem; margin: 0 0 2rem; }
.result strong { color: var(--dt-navy); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 22px; }
.card-link { text-decoration: none; color: inherit; display: block; }
.empty { text-align: center; color: var(--dt-muted); margin-top: 2rem; }
.link { color: var(--dt-cyan-d); }
</style>
