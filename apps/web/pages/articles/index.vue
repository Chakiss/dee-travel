<script setup lang="ts">
import { getDocs, query, where, limit } from 'firebase/firestore'
import type { Article, Place } from '@deetravel/types'
import { PlaceCard } from '@deetravel/ui'

useHead({ title: 'บทความ — Dee Travel' })

const { db, typedCollection, toPlain } = useFirestore()
const imageBucket = useRuntimeConfig().public.imageBucket as string

const { data: items } = await useAsyncData('articles', async () => {
  const q = query(typedCollection(db, 'articles'), where('status', '==', 'published'), limit(60))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toPlain<Article>(d.data()))
})
</script>

<template>
  <main class="wrap">
    <div class="dt-section-head">
      <p class="dt-eyebrow">DeeStory</p>
      <h1 class="dt-title">บทความแนะนำ</h1>
      <hr class="dt-divider">
    </div>
    <div class="grid">
      <NuxtLink v-for="a in items" :key="a.id" :to="`/articles/${a.slug}`" class="card-link">
        <PlaceCard :place="(a as unknown as Place)" :bucket="imageBucket" />
      </NuxtLink>
    </div>
    <p v-if="!items?.length" class="empty">ยังไม่มีบทความ</p>
  </main>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 5vh 24px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 22px; }
.card-link { text-decoration: none; color: inherit; display: block; }
.empty { text-align: center; color: var(--dt-muted); }
</style>
