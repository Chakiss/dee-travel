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
.place-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4dfd3;
  border-radius: 14px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.place-card:hover {
  box-shadow: 0 12px 28px -14px rgba(26, 33, 30, 0.35);
  transform: translateY(-2px);
}
.body {
  padding: 14px 16px 16px;
}
.name {
  margin: 0 0 0.35em;
  font-size: 1.02rem;
  line-height: 1.3;
}
.excerpt {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #57625b;
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
  padding: 3px 9px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: #0f7a63;
  border-radius: 100px;
}
@media (prefers-color-scheme: dark) {
  .place-card {
    background: #181e19;
    border-color: #2a322b;
  }
  .excerpt {
    color: #9eaaa0;
  }
}
</style>
