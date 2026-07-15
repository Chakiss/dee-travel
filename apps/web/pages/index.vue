<script setup lang="ts">
// Type-only import proves the workspace wiring to @deetravel/types.
import type { Place } from '@deetravel/types'

useHead({ title: 'Dee Travel — เที่ยวอย่างลึกซึ้ง สนุกตามสไตล์' })

// Placeholder until Phase 2 wires real Firestore data via packages/firebase.
const featured: Pick<Place, 'name' | 'excerpt'>[] = [
  { name: 'Dee Travel', excerpt: 'รวมสถานที่ท่องเที่ยวทั่วไทย 590 แห่ง พร้อมกลับมาให้เที่ยว' },
]
</script>

<template>
  <main class="wrap">
    <p class="eyebrow">Public site · SSR</p>
    <h1>Dee Travel</h1>
    <p v-for="p in featured" :key="p.name" class="lede">{{ p.excerpt }}</p>
    <p class="note">Phase 1 scaffold — Firestore content wired in Phase 2.</p>
  </main>
</template>

<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
.wrap { max-width: 720px; margin: 0 auto; padding: 15vh 24px; }
.eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .72rem; font-weight: 700; color: #0f7a63; }
h1 { font-size: clamp(2.4rem, 6vw, 3.6rem); margin: .1em 0 .3em; }
.lede { font-size: 1.15rem; color: #57625b; }
.note { margin-top: 2rem; font-size: .85rem; color: #8a938b; }
</style>
