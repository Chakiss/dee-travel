<script setup lang="ts">
import { getDocs } from 'firebase/firestore'

useHead({ title: 'ภาพรวม — Dee Travel Admin' })
const { db, typedCollection } = useFirebase()

const { data: stats } = await useAsyncData('admin-stats', async () => {
  const [places, articles, events] = await Promise.all([
    getDocs(typedCollection(db, 'places')),
    getDocs(typedCollection(db, 'articles')),
    getDocs(typedCollection(db, 'events')),
  ])
  const published = places.docs.filter((d) => d.get('status') === 'published').length
  const drafts = places.size - published
  return { places: places.size, articles: articles.size, events: events.size, published, drafts }
})

const cards = computed(() => [
  { label: 'สถานที่', value: stats.value?.places ?? 0, to: '/places' },
  { label: 'บทความ', value: stats.value?.articles ?? 0, to: '/places' },
  { label: 'เทศกาล', value: stats.value?.events ?? 0, to: '/places' },
])
</script>

<template>
  <div>
    <header class="head">
      <h1>ภาพรวม</h1>
      <p class="sub">จัดการเนื้อหา Dee Travel</p>
    </header>

    <section class="cards">
      <NuxtLink v-for="c in cards" :key="c.label" :to="c.to" class="stat">
        <span class="num">{{ c.value }}</span>
        <span class="lbl">{{ c.label }}</span>
      </NuxtLink>
    </section>

    <section class="split">
      <div class="mini published">
        <span class="mnum">{{ stats?.published ?? 0 }}</span>
        <span>เผยแพร่แล้ว</span>
      </div>
      <div class="mini draft">
        <span class="mnum">{{ stats?.drafts ?? 0 }}</span>
        <span>ฉบับร่าง</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.head { margin-bottom: 1.6rem; }
h1 { font-size: 1.7rem; font-weight: 600; color: var(--dt-navy); margin: 0; }
.sub { color: var(--dt-muted); margin: 0.2rem 0 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 16px; }
.stat {
  background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 14px;
  padding: 22px; display: flex; flex-direction: column; gap: 4px; transition: border-color 0.15s;
}
.stat:hover { border-color: var(--dt-cyan); }
.num { font-size: 2.2rem; font-weight: 700; color: var(--dt-navy); font-variant-numeric: tabular-nums; }
.lbl { color: var(--dt-muted); font-size: 0.9rem; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 420px; }
.mini {
  background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 12px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; color: var(--dt-muted);
}
.mnum { font-size: 1.4rem; font-weight: 700; }
.mini.published .mnum { color: var(--st-published); }
.mini.draft .mnum { color: var(--st-draft); }
</style>
