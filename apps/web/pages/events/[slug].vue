<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { EventItem } from '@deetravel/types'
import { coverVariants } from '@deetravel/ui'

const route = useRoute()
const slug = String(route.params.slug)
const { db, typedCollection, toPlain } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

const { data: ev } = await useAsyncData(`event-${slug}`, async () => {
  const q = query(
    typedCollection(db, 'events'),
    where('status', '==', 'published'),
    where('slug', '==', slug),
    limit(1),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : toPlain<EventItem>(snap.docs[0].data())
})

if (!ev.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบกิจกรรมนี้' })

const cover = computed(() => (ev.value?.cover ? coverVariants(imageBucket, ev.value.cover) : null))
const dates = computed(() => {
  const p = (ev.value?.period ?? []) as { date?: string | { toDate?: () => Date } }[]
  return p
    .map((x) => {
      const d = x?.date
      const iso = typeof d === 'string' ? d : d?.toDate?.()?.toISOString?.()
      return iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : null
    })
    .filter(Boolean) as string[]
})

useHead(() => ({
  title: ev.value ? `${ev.value.name} — Dee Travel` : 'Dee Travel',
  meta: [{ name: 'description', content: ev.value?.excerpt ?? '' }],
}))
</script>

<template>
  <article v-if="ev" class="detail">
    <NuxtLink to="/events" class="back">← กิจกรรมทั้งหมด</NuxtLink>
    <figure v-if="cover" class="cover"><img :src="cover.large" :alt="ev.name"></figure>
    <header class="head">
      <p class="dt-eyebrow">DeeEvent</p>
      <h1>{{ ev.name }}</h1>
      <p v-if="ev.excerpt" class="excerpt">{{ ev.excerpt }}</p>
    </header>
    <p v-if="dates.length" class="dates">🗓️ {{ dates.join(' – ') }}</p>
    <div class="content" v-html="ev.content" />
  </article>
</template>

<style scoped>
.detail { max-width: 760px; margin: 0 auto; padding: 3vh 24px 0; }
.back { display: inline-block; margin-bottom: 1.4rem; font-size: 0.9rem; text-decoration: none; color: var(--dt-cyan); }
.cover { margin: 0 0 1.8rem; border-radius: 14px; overflow: hidden; aspect-ratio: 16 / 9; background: var(--dt-surface-2); }
.cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.head { margin-bottom: 1rem; }
.head h1 { font-family: var(--font-body); font-weight: 600; font-style: italic; color: var(--dt-navy); font-size: clamp(1.8rem, 4.5vw, 2.6rem); line-height: 1.2; margin: 0.15em 0 0.3em; }
.excerpt { font-size: 1.1rem; color: var(--dt-muted); margin: 0; }
.dates { color: var(--dt-gold-d); font-weight: 500; margin: 0 0 1.5rem; }
.content { font-size: 1.04rem; line-height: 1.85; color: var(--dt-ink); }
.content :deep(p) { margin: 0 0 1em; }
.content :deep(img) { max-width: 100%; height: auto; border-radius: 10px; }
.content :deep(figure) { margin: 1.2em 0; }
.content :deep(a) { color: var(--dt-cyan-d); }
</style>
