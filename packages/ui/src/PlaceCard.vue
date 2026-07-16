<script setup lang="ts">
import type { Place } from '@deetravel/types'
import ImageWithVariants from './ImageWithVariants.vue'

defineProps<{
  place: Place
  /** Storage bucket the cover images live in. */
  bucket: string
}>()
</script>

<template>
  <article class="place-card">
    <ImageWithVariants
      :cover="place.cover"
      :bucket="bucket"
      :alt="place.name"
      ratio="4 / 3"
    />
    <div class="body">
      <h3 class="name">{{ place.name }}</h3>
      <p v-if="place.excerpt" class="excerpt">{{ place.excerpt }}</p>
    </div>
    <span v-if="place.featured" class="badge">แนะนำ</span>
  </article>
</template>

<style scoped>
/* Uses Dee Travel design tokens when present (var --dt-*), with safe fallbacks. */
.place-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--dt-surface, #fff);
  border: 1px solid var(--dt-line, #e7e9ee);
  border-radius: 12px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.place-card:hover {
  box-shadow: 0 14px 30px -16px rgba(20, 26, 38, 0.4);
  transform: translateY(-3px);
}
.body {
  padding: 14px 16px 18px;
}
.name {
  margin: 0 0 0.35em;
  font-family: var(--font-body, inherit);
  font-weight: 500;
  font-size: 1.04rem;
  line-height: 1.35;
  color: var(--dt-navy, #242a3a);
}
.excerpt {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  font-weight: 300;
  color: var(--dt-muted, #6b7280);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  font-family: var(--font-body, inherit);
  font-size: 0.7rem;
  font-weight: 500;
  color: #fff;
  background: var(--dt-gold, #db9d1b);
  border-radius: 3px;
}
</style>
