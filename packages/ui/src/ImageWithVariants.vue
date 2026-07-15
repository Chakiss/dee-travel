<script setup lang="ts">
import { computed, ref } from 'vue'
import { coverVariants } from './storage'

const props = withDefaults(
  defineProps<{
    /** Cover folder path, e.g. "/images/places/{id}/cover". */
    cover?: string
    /** Storage bucket the images live in. */
    bucket: string
    alt?: string
    sizes?: string
    /** CSS aspect-ratio, e.g. "4 / 3". */
    ratio?: string
  }>(),
  {
    cover: '',
    alt: '',
    sizes: '(max-width: 640px) 100vw, 400px',
    ratio: '4 / 3',
  },
)

const loaded = ref(false)
const variants = computed(() =>
  props.cover ? coverVariants(props.bucket, props.cover) : null,
)
const srcset = computed(() =>
  variants.value
    ? `${variants.value.thumbnail} 320w, ${variants.value.medium} 800w, ${variants.value.large} 1600w`
    : '',
)
</script>

<template>
  <div class="iv" :style="{ aspectRatio: ratio }">
    <template v-if="variants">
      <div
        class="ph blur"
        :style="{ backgroundImage: `url(${variants.tiny})` }"
        aria-hidden="true"
      />
      <img
        :src="variants.medium"
        :srcset="srcset"
        :sizes="sizes"
        :alt="alt"
        loading="lazy"
        decoding="async"
        :class="{ loaded }"
        @load="loaded = true"
      >
    </template>
    <div v-else class="ph" aria-hidden="true" />
  </div>
</template>

<style scoped>
.iv {
  position: relative;
  overflow: hidden;
  width: 100%;
  background: #ece8df;
}
.ph {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.ph.blur {
  filter: blur(14px);
  transform: scale(1.12);
}
img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.45s ease;
}
img.loaded {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  img {
    transition: none;
  }
}
</style>
