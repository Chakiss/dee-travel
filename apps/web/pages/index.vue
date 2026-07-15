<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Place } from '@deetravel/types'
import { PlaceCard } from '@deetravel/ui'

useHead({ title: 'Dee Travel — เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์' })

const { db, typedCollection } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

// Fetched server-side (SSR) → real content lands in the initial HTML for SEO.
const { data: places, error } = await useAsyncData('featured-places', async () => {
  const q = query(
    typedCollection(db, 'places'),
    where('status', '==', 'published'),
    limit(12),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Place)
})
</script>

<template>
  <main class="wrap">
    <header class="hero">
      <p class="eyebrow">Dee Travel · Public</p>
      <h1>เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์</h1>
      <p class="lede">รวมสถานที่ท่องเที่ยวทั่วไทย คัดสรรมาให้คุณออกเดินทาง</p>
    </header>

    <p v-if="error" class="err">โหลดข้อมูลไม่สำเร็จ — emulator รันอยู่หรือไม่?</p>

    <section v-else>
      <h2 class="sec">สถานที่แนะนำ <span class="count">{{ places?.length ?? 0 }}</span></h2>
      <div class="grid">
        <PlaceCard
          v-for="p in places"
          :key="p.id"
          :place="p"
          :bucket="imageBucket"
        />
      </div>
      <p v-if="!places?.length" class="empty">
        ยังไม่มีข้อมูล — รัน <code>pnpm seed</code> เพื่อใส่ตัวอย่าง
      </p>
    </section>
  </main>
</template>

<style>
:root { color-scheme: light dark; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #1a211e;
  background: #faf8f3;
}
@media (prefers-color-scheme: dark) {
  body { background: #12140f; color: #ecefe9; }
}
.wrap { max-width: 1080px; margin: 0 auto; padding: 8vh 24px 12vh; }
.hero { margin-bottom: 3.5rem; }
.eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .72rem; font-weight: 700; color: #0f7a63; }
h1 { font-size: clamp(2.2rem, 5.5vw, 3.4rem); margin: .15em 0 .25em; line-height: 1.15; }
.lede { font-size: 1.12rem; color: #57625b; margin: 0; }
@media (prefers-color-scheme: dark) { .lede { color: #9eaaa0; } }
.sec { font-size: 1.2rem; display: flex; align-items: center; gap: .5rem; margin: 0 0 1.2rem; }
.count { font-size: .78rem; background: #dcebe5; color: #0b5d4b; border-radius: 100px; padding: 2px 10px; font-variant-numeric: tabular-nums; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.empty, .err { color: #8a938b; font-size: .9rem; }
.err { color: #b8472f; }
</style>
