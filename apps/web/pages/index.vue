<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Place } from '@deetravel/types'
import { PlaceCard, coverVariants } from '@deetravel/ui'

useHead({ title: 'Dee Travel — เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์' })

const { db, typedCollection, toPlain } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

const { data: places, error } = await useAsyncData('featured-places', async () => {
  const q = query(
    typedCollection(db, 'places'),
    where('status', '==', 'published'),
    limit(12),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toPlain<Place>(d.data()))
})

// Full-bleed hero image from the first place's cover (legacy pattern).
const heroBg = computed(() => {
  const first = places.value?.[0]
  return first?.cover ? coverVariants(imageBucket, first.cover).large : null
})
</script>

<template>
  <div>
    <section class="hero" :style="heroBg ? { backgroundImage: `url(${heroBg})` } : undefined">
      <div class="hero-inner">
        <img src="/brand/logo-white.png" alt="Dee Travel" class="hero-logo">
        <p class="hero-tag">เที่ยวสนุกตามวิถีแบบไทย</p>
        <h1 class="wordmark">DeeTravel</h1>
        <div class="hero-search">
          <HeroSearch />
        </div>
      </div>
    </section>

    <main class="wrap">
      <div class="dt-section-head">
        <p class="dt-eyebrow">DeeDestination</p>
        <h2 class="dt-title">สถานที่แนะนำ</h2>
        <hr class="dt-divider">
      </div>

      <p v-if="error" class="err">โหลดข้อมูลไม่สำเร็จ — emulator รันอยู่หรือไม่?</p>

      <div v-else class="grid">
        <NuxtLink
          v-for="p in places"
          :key="p.id"
          :to="`/places/${p.slug}`"
          class="card-link"
        >
          <PlaceCard :place="p" :bucket="imageBucket" />
        </NuxtLink>
      </div>
      <p v-if="!error && !places?.length" class="empty">
        ยังไม่มีข้อมูล — รัน <code>pnpm seed</code> เพื่อใส่ตัวอย่าง
      </p>
    </main>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 74vh;
  display: grid;
  place-items: center;
  background-color: var(--dt-navy);
  background-size: cover;
  background-position: center;
  text-align: center;
  color: #fff;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(20, 26, 38, 0.45), rgba(20, 26, 38, 0.62));
}
.hero-inner { position: relative; z-index: 1; padding: 24px; }
.hero-logo { height: 88px; width: auto; margin-bottom: 0.5rem; filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3)); }
.hero-tag {
  font-family: var(--font-body);
  font-style: italic;
  font-weight: 300;
  font-size: clamp(1rem, 2.4vw, 1.35rem);
  letter-spacing: 0.02em;
  margin: 0;
  opacity: 0.95;
}
.wordmark {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(3.2rem, 9vw, 6.5rem);
  line-height: 1;
  margin: 0.05em 0 0;
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
}
.hero-search { margin-top: 2rem; }

.wrap { max-width: 1100px; margin: 0 auto; padding: 4.5rem 24px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 22px; }
.card-link { text-decoration: none; color: inherit; display: block; }
.empty, .err { text-align: center; color: var(--dt-muted); font-size: 0.9rem; }
.err { color: #c0392b; }
</style>
