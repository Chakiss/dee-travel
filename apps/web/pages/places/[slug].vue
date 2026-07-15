<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Place } from '@deetravel/types'
import { coverVariants } from '@deetravel/ui'

const route = useRoute()
const slug = String(route.params.slug)

const { db, typedCollection } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

const { data: place } = await useAsyncData(`place-${slug}`, async () => {
  // Must filter by status too: the security rules only permit reads of published
  // docs, so a list query has to constrain to them (needs a status+slug index).
  const q = query(
    typedCollection(db, 'places'),
    where('status', '==', 'published'),
    where('slug', '==', slug),
    limit(1),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : (snap.docs[0].data() as Place)
})

if (!place.value) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบสถานที่นี้' })
}

const cover = computed(() =>
  place.value?.cover ? coverVariants(imageBucket, place.value.cover) : null,
)

const mapUrl = computed(() => {
  const pos = place.value?.position
  return pos ? `https://www.google.com/maps/search/?api=1&query=${pos.latitude},${pos.longitude}` : null
})

const hasValue = (v?: string) => !!v && v.trim() !== '' && v.trim() !== '-'

useHead(() => ({
  title: place.value ? `${place.value.name} — Dee Travel` : 'Dee Travel',
  meta: [{ name: 'description', content: place.value?.excerpt ?? '' }],
}))
</script>

<template>
  <article v-if="place" class="detail">
    <NuxtLink to="/" class="back">← กลับหน้าแรก</NuxtLink>

    <figure v-if="cover" class="cover">
      <img :src="cover.large" :alt="place.name">
    </figure>

    <header class="head">
      <h1>{{ place.name }}</h1>
      <p v-if="place.excerpt" class="excerpt">{{ place.excerpt }}</p>
    </header>

    <dl v-if="hasValue(place.format_address) || mapUrl || hasValue(place.phone) || hasValue(place.website)" class="meta">
      <div v-if="hasValue(place.format_address)">
        <dt>ที่อยู่</dt>
        <dd>{{ place.format_address }}</dd>
      </div>
      <div v-if="hasValue(place.phone)">
        <dt>โทร</dt>
        <dd>{{ place.phone }}</dd>
      </div>
      <div v-if="hasValue(place.website)">
        <dt>เว็บไซต์</dt>
        <dd><a :href="place.website" target="_blank" rel="noopener">{{ place.website }}</a></dd>
      </div>
      <div v-if="mapUrl">
        <dt>แผนที่</dt>
        <dd><a :href="mapUrl" target="_blank" rel="noopener">เปิดใน Google Maps</a></dd>
      </div>
    </dl>

    <!-- Trusted CMS content authored in the admin. -->
    <div class="content" v-html="place.content" />
  </article>
</template>

<style scoped>
.detail { max-width: 760px; margin: 0 auto; padding: 4vh 24px 0; }
.back { display: inline-block; margin-bottom: 1.5rem; font-size: 0.9rem; text-decoration: none; color: #0f7a63; }
.cover { margin: 0 0 1.8rem; border-radius: 16px; overflow: hidden; aspect-ratio: 16 / 9; background: #ece8df; }
.cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.head h1 { font-size: clamp(1.8rem, 4.5vw, 2.6rem); margin: 0 0 0.3em; line-height: 1.2; }
.excerpt { font-size: 1.1rem; color: #57625b; margin: 0 0 1.5rem; }
.meta { display: grid; gap: 10px; margin: 0 0 2rem; padding: 18px 20px; border: 1px solid #e4dfd3; border-radius: 12px; }
.meta div { display: grid; grid-template-columns: 92px 1fr; gap: 12px; font-size: 0.92rem; }
.meta dt { color: #8a938b; margin: 0; }
.meta dd { margin: 0; }
.meta a { color: #0f7a63; }
.content { font-size: 1.02rem; line-height: 1.8; }
.content :deep(p) { margin: 0 0 1em; }
.content :deep(img) { max-width: 100%; height: auto; border-radius: 10px; }
.content :deep(figure) { margin: 1.2em 0; }
.content :deep(a) { color: #0f7a63; }
@media (prefers-color-scheme: dark) {
  .excerpt { color: #9eaaa0; }
  .meta { border-color: #2a322b; }
}
</style>
