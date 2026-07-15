<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Place } from '@deetravel/types'

useHead({ title: 'Dee Travel — เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์' })

const { db, typedCollection } = useFirestore()

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
    <p class="eyebrow">Public site · SSR</p>
    <h1>Dee Travel</h1>
    <p class="lede">เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์ — สถานที่ท่องเที่ยวทั่วไทย</p>

    <p v-if="error" class="err">โหลดข้อมูลไม่สำเร็จ (emulator รันอยู่หรือไม่?)</p>

    <section v-else class="places">
      <h2>สถานที่แนะนำ <span class="count">{{ places?.length ?? 0 }}</span></h2>
      <ul class="grid">
        <li v-for="p in places" :key="p.id" class="card">
          <h3>{{ p.name }}</h3>
          <p class="excerpt">{{ p.excerpt }}</p>
          <span v-if="p.featured" class="badge">แนะนำ</span>
        </li>
      </ul>
      <p v-if="!places?.length" class="empty">ยังไม่มีข้อมูล — รัน <code>pnpm seed</code> เพื่อใส่ตัวอย่าง</p>
    </section>

    <p class="note">Phase 1 → 2 — อ่านจาก Firestore emulator ผ่าน @deetravel/firebase</p>
  </main>
</template>

<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1a211e; }
@media (prefers-color-scheme: dark) { body { background: #12140f; color: #ecefe9; } }
.wrap { max-width: 860px; margin: 0 auto; padding: 10vh 24px 12vh; }
.eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .72rem; font-weight: 700; color: #0f7a63; }
h1 { font-size: clamp(2.4rem, 6vw, 3.4rem); margin: .1em 0 .2em; }
.lede { font-size: 1.1rem; color: #57625b; margin: 0 0 3rem; }
h2 { font-size: 1.15rem; display: flex; align-items: center; gap: .5rem; }
.count { font-size: .8rem; background: #dcebe5; color: #0b5d4b; border-radius: 100px; padding: 2px 9px; font-variant-numeric: tabular-nums; }
.grid { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.card { position: relative; padding: 18px; border: 1px solid #e4dfd3; border-radius: 12px; }
@media (prefers-color-scheme: dark) { .card { border-color: #2a322b; } }
.card h3 { margin: 0 0 .4em; font-size: 1.05rem; }
.excerpt { margin: 0; font-size: .9rem; color: #57625b; }
.badge { position: absolute; top: 12px; right: 12px; font-size: .68rem; font-weight: 700; color: #a9792a; }
.empty, .err { color: #8a938b; font-size: .9rem; }
.err { color: #b8472f; }
.note { margin-top: 2.5rem; font-size: .82rem; color: #8a938b; }
</style>
