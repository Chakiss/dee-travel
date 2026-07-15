<script setup lang="ts">
import type { CollectionId } from '@deetravel/types'

// The CMS surfaces, grounded in real collections (counts from Phase 0 audit).
const sections: { id: CollectionId; label: string; count: number }[] = [
  { id: 'places', label: 'สถานที่', count: 590 },
  { id: 'events', label: 'เทศกาล / กิจกรรม', count: 36 },
  { id: 'articles', label: 'บทความ', count: 10 },
  { id: 'categories', label: 'หมวดหมู่', count: 12 },
]
</script>

<template>
  <main class="wrap">
    <p class="eyebrow">Dee Travel · Admin (SPA)</p>
    <h1>Content overview</h1>
    <ul class="grid">
      <li v-for="s in sections" :key="s.id" class="card">
        <span class="count">{{ s.count }}</span>
        <span class="label">{{ s.label }}</span>
      </li>
    </ul>
    <p class="note">Phase 1 scaffold — CRUD, auth &amp; Facebook toolkit arrive in Phases 3–4.</p>
  </main>
</template>

<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
.wrap { max-width: 860px; margin: 0 auto; padding: 8vh 24px; }
.eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: .72rem; font-weight: 700; color: #0f7a63; }
h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: .1em 0 1em; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.card { display: flex; flex-direction: column; gap: 4px; padding: 20px; border: 1px solid #e4dfd3; border-radius: 12px; }
.count { font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.label { color: #57625b; font-size: .9rem; }
.note { margin-top: 2rem; font-size: .85rem; color: #8a938b; }
</style>
