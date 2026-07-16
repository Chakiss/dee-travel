<script setup lang="ts">
import { getDocs } from 'firebase/firestore'
import type { Province, District } from '@deetravel/types'

const props = withDefaults(
  defineProps<{ province?: string; district?: string; q?: string }>(),
  { province: '', district: '', q: '' },
)

const { db, typedCollection, toPlain } = useFirestore()

const { data: geo } = await useAsyncData('hero-geo', async () => {
  const [ps, ds] = await Promise.all([
    getDocs(typedCollection(db, 'provinces')),
    getDocs(typedCollection(db, 'districts')),
  ])
  return {
    provinces: ps.docs.map((d) => toPlain<Province>(d.data())),
    districts: ds.docs.map((d) => toPlain<District & { provinceId?: string }>(d.data())),
  }
})

const selProvince = ref(props.province)
const selDistrict = ref(props.district)
const keyword = ref(props.q)

const provinces = computed(() =>
  [...(geo.value?.provinces ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'th')),
)
const districts = computed(() =>
  (geo.value?.districts ?? [])
    .filter((d) => !selProvince.value || (d as { provinceId?: string }).provinceId === selProvince.value)
    .sort((a, b) => a.name.localeCompare(b.name, 'th')),
)

watch(selProvince, () => { selDistrict.value = '' })

function submit() {
  const query: Record<string, string> = {}
  if (selProvince.value) query.province = selProvince.value
  if (selDistrict.value) query.district = selDistrict.value
  if (keyword.value.trim()) query.q = keyword.value.trim()
  navigateTo({ path: '/places', query })
}
</script>

<template>
  <form class="search" @submit.prevent="submit">
    <label class="field">
      <span class="lbl">จังหวัด</span>
      <select v-model="selProvince">
        <option value="">ทุกจังหวัด</option>
        <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </label>
    <label class="field">
      <span class="lbl">อำเภอ</span>
      <select v-model="selDistrict" :disabled="!selProvince">
        <option value="">ทุกอำเภอ</option>
        <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </label>
    <label class="field grow">
      <span class="lbl">ค้นหาสถานที่</span>
      <input v-model="keyword" type="search" placeholder="ชื่อสถานที่...">
    </label>
    <button type="submit" class="go">ค้นหา</button>
  </form>
</template>

<style scoped>
.search {
  display: flex;
  align-items: stretch;
  gap: 1px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  max-width: 760px;
  margin: 0 auto;
}
.field {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 10px 16px;
  background: #fff;
  min-width: 0;
  text-align: left;
}
.field.grow { flex: 1; }
.lbl {
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--dt-cyan-d);
  letter-spacing: 0.02em;
}
.field select,
.field input {
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--dt-navy);
  padding: 2px 0;
  max-width: 100%;
}
.field select:disabled { color: #b9bec8; }
.field + .field { box-shadow: -1px 0 0 var(--dt-line); }
.go {
  border: 0;
  background: var(--dt-gold);
  color: #fff;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 1rem;
  padding: 0 30px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.go:hover { background: var(--dt-gold-d); }

@media (max-width: 640px) {
  .search { flex-direction: column; gap: 0; }
  .field + .field { box-shadow: 0 -1px 0 var(--dt-line); }
  .go { padding: 14px; }
}
</style>
