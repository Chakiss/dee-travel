<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Article } from '@deetravel/types'
import { coverVariants } from '@deetravel/ui'

const route = useRoute()
const slug = String(route.params.slug)
const { db, typedCollection, toPlain } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  const q = query(
    typedCollection(db, 'articles'),
    where('status', '==', 'published'),
    where('slug', '==', slug),
    limit(1),
  )
  const snap = await getDocs(q)
  return snap.empty ? null : toPlain<Article>(snap.docs[0].data())
})

if (!article.value) throw createError({ statusCode: 404, statusMessage: 'ไม่พบบทความนี้' })

const cover = computed(() => (article.value?.cover ? coverVariants(imageBucket, article.value.cover) : null))
useHead(() => ({
  title: article.value ? `${article.value.name} — Dee Travel` : 'Dee Travel',
  meta: [{ name: 'description', content: article.value?.excerpt ?? '' }],
}))
</script>

<template>
  <article v-if="article" class="detail">
    <NuxtLink to="/articles" class="back">← บทความทั้งหมด</NuxtLink>
    <figure v-if="cover" class="cover"><img :src="cover.large" :alt="article.name"></figure>
    <header class="head">
      <p class="dt-eyebrow">DeeStory</p>
      <h1>{{ article.name }}</h1>
      <p v-if="article.excerpt" class="excerpt">{{ article.excerpt }}</p>
    </header>
    <div class="content" v-html="article.content" />
  </article>
</template>

<style scoped>
.detail { max-width: 760px; margin: 0 auto; padding: 3vh 24px 0; }
.back { display: inline-block; margin-bottom: 1.4rem; font-size: 0.9rem; text-decoration: none; color: var(--dt-cyan); }
.cover { margin: 0 0 1.8rem; border-radius: 14px; overflow: hidden; aspect-ratio: 16 / 9; background: var(--dt-surface-2); }
.cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.head { margin-bottom: 1.8rem; }
.head h1 { font-family: var(--font-body); font-weight: 600; font-style: italic; color: var(--dt-navy); font-size: clamp(1.8rem, 4.5vw, 2.6rem); line-height: 1.2; margin: 0.15em 0 0.3em; }
.excerpt { font-size: 1.1rem; color: var(--dt-muted); margin: 0; }
.content { font-size: 1.04rem; line-height: 1.85; color: var(--dt-ink); }
.content :deep(p) { margin: 0 0 1em; }
.content :deep(img) { max-width: 100%; height: auto; border-radius: 10px; }
.content :deep(figure) { margin: 1.2em 0; }
.content :deep(a) { color: var(--dt-cyan-d); }
</style>
