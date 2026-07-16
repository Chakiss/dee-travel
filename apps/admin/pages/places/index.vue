<script setup lang="ts">
import { getDocs, query, orderBy } from 'firebase/firestore'
import type { Place } from '@deetravel/types'

useHead({ title: 'สถานที่ — Dee Travel Admin' })
const { db, typedCollection, toPlain } = useFirebase()

const { data: places, refresh } = await useAsyncData('admin-places', async () => {
  // Editor claim lets us read every doc (incl. drafts).
  const snap = await getDocs(query(typedCollection(db, 'places'), orderBy('updatedAt', 'desc')))
  return snap.docs.map((d) => toPlain<Place>(d.data()))
})

const search = ref('')
const filtered = computed(() => {
  const k = search.value.trim().toLowerCase()
  const list = places.value ?? []
  return k ? list.filter((p) => `${p.name} ${p.provinceName ?? ''}`.toLowerCase().includes(k)) : list
})

const statusLabel: Record<string, string> = {
  published: 'เผยแพร่', draft: 'ฉบับร่าง', ready: 'พร้อม', scheduled: 'ตั้งเวลา', archived: 'เก็บ',
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1>สถานที่</h1>
        <p class="sub">{{ filtered.length }} รายการ</p>
      </div>
      <NuxtLink to="/places/new" class="btn btn-primary">+ เพิ่มสถานที่</NuxtLink>
    </header>

    <input v-model="search" class="search" type="search" placeholder="ค้นหาชื่อ / จังหวัด…">

    <div class="tablewrap">
      <table>
        <thead>
          <tr><th>ชื่อสถานที่</th><th>จังหวัด</th><th>อำเภอ</th><th>สถานะ</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id">
            <td class="name">{{ p.name }}</td>
            <td>{{ p.provinceName ?? '—' }}</td>
            <td>{{ p.districtName ?? '—' }}</td>
            <td><span class="status" :class="p.status ?? 'draft'">{{ statusLabel[p.status ?? 'draft'] }}</span></td>
            <td class="right">
              <NuxtLink :to="`/facebook/${p.id}`" class="fb">Facebook</NuxtLink>
              <NuxtLink :to="`/places/${p.id}`" class="edit">แก้ไข</NuxtLink>
            </td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="5" class="empty">ไม่พบสถานที่</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 1.2rem; }
h1 { font-size: 1.7rem; font-weight: 600; color: var(--dt-navy); margin: 0; }
.sub { color: var(--dt-muted); margin: 0.2rem 0 0; }
.search {
  width: 100%; max-width: 360px; margin-bottom: 16px; padding: 10px 14px;
  border: 1px solid var(--dt-line); border-radius: 8px; outline: none; font-size: 0.95rem;
}
.search:focus { border-color: var(--dt-cyan); }
.tablewrap { background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 12px; overflow: hidden; }
table { border-collapse: collapse; width: 100%; font-size: 0.92rem; }
th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--dt-line); }
thead th { background: var(--dt-surface-2); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--dt-muted); font-weight: 600; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: var(--dt-surface-2); }
.name { font-weight: 500; color: var(--dt-navy); }
.right { text-align: right; white-space: nowrap; }
.edit { color: var(--dt-cyan-d); font-weight: 500; }
.fb { color: var(--dt-gold-d); font-weight: 500; margin-right: 16px; }
.empty { text-align: center; color: var(--dt-muted); }
</style>
