<script setup lang="ts">
import {
  doc, getDoc, setDoc, updateDoc, collection, serverTimestamp,
} from 'firebase/firestore'
import type { Place, ContentStatus } from '@deetravel/types'

const route = useRoute()
const id = String(route.params.id)
const isNew = id === 'new'

const { db, typedCollection, toPlain } = useFirebase()

const form = reactive<Partial<Place>>({
  name: '', slug: '', excerpt: '', content: '',
  status: 'draft', format_address: '', phone: '', website: '',
  provinceName: '', districtName: '', featured: false, cover: '',
})
const saving = ref(false)
const saved = ref(false)
const error = ref('')

if (!isNew) {
  const snap = await getDoc(doc(db, 'places', id))
  if (!snap.exists()) throw createError({ statusCode: 404, statusMessage: 'ไม่พบสถานที่' })
  Object.assign(form, toPlain<Place>({ id: snap.id, ...snap.data() }))
}

useHead({ title: `${isNew ? 'เพิ่มสถานที่' : form.name} — Dee Travel Admin` })

const statuses: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'ฉบับร่าง' },
  { value: 'ready', label: 'พร้อมเผยแพร่' },
  { value: 'published', label: 'เผยแพร่' },
  { value: 'archived', label: 'เก็บ' },
]

async function save() {
  error.value = ''
  saving.value = true
  saved.value = false
  try {
    const payload: Record<string, unknown> = {
      name: form.name, slug: form.slug, excerpt: form.excerpt, content: form.content,
      status: form.status, format_address: form.format_address, phone: form.phone,
      website: form.website, provinceName: form.provinceName, districtName: form.districtName,
      featured: !!form.featured, cover: form.cover ?? '', updatedAt: serverTimestamp(),
    }
    if (form.status === 'published') payload.publishedAt = serverTimestamp()

    if (isNew) {
      const ref = doc(collection(db, 'places'))
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() })
      await navigateTo(`/places/${ref.id}`)
    } else {
      await updateDoc(doc(db, 'places', id), payload)
    }
    saved.value = true
  } catch (e) {
    error.value = 'บันทึกไม่สำเร็จ — สิทธิ์ (editor) ไม่พอ หรือเครือข่ายมีปัญหา'
  } finally {
    saving.value = false
  }
}

function setStatus(s: ContentStatus) {
  form.status = s
  save()
}
</script>

<template>
  <div class="editor">
    <NuxtLink to="/places" class="back">← สถานที่ทั้งหมด</NuxtLink>

    <header class="head">
      <h1>{{ isNew ? 'เพิ่มสถานที่' : 'แก้ไขสถานที่' }}</h1>
      <div class="actions">
        <span v-if="saved" class="ok">บันทึกแล้ว ✓</span>
        <button v-if="form.status !== 'published'" class="btn btn-ghost" :disabled="saving" @click="setStatus('published')">เผยแพร่</button>
        <button v-else class="btn btn-ghost" :disabled="saving" @click="setStatus('draft')">เปลี่ยนเป็นฉบับร่าง</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'กำลังบันทึก…' : 'บันทึก' }}</button>
      </div>
    </header>

    <p v-if="error" class="err">{{ error }}</p>

    <div class="grid">
      <section class="col main">
        <label class="f"><span>ชื่อสถานที่</span><input v-model="form.name" type="text"></label>
        <label class="f"><span>Slug (URL)</span><input v-model="form.slug" type="text"></label>
        <label class="f"><span>คำโปรย</span><textarea v-model="form.excerpt" rows="2" /></label>
        <label class="f"><span>เนื้อหา (HTML)</span><textarea v-model="form.content" rows="12" class="mono" /></label>
      </section>

      <aside class="col side">
        <label class="f">
          <span>สถานะ</span>
          <select v-model="form.status">
            <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
        <label class="chk"><input v-model="form.featured" type="checkbox"> แนะนำ (Featured)</label>
        <label class="f"><span>จังหวัด</span><input v-model="form.provinceName" type="text"></label>
        <label class="f"><span>อำเภอ</span><input v-model="form.districtName" type="text"></label>
        <label class="f"><span>ที่อยู่</span><textarea v-model="form.format_address" rows="2" /></label>
        <label class="f"><span>โทร</span><input v-model="form.phone" type="text"></label>
        <label class="f"><span>เว็บไซต์</span><input v-model="form.website" type="text"></label>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.back { color: var(--dt-cyan-d); font-weight: 500; font-size: 0.9rem; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0.8rem 0 1.2rem; flex-wrap: wrap; }
h1 { font-size: 1.6rem; font-weight: 600; color: var(--dt-navy); margin: 0; }
.actions { display: flex; align-items: center; gap: 10px; }
.ok { color: var(--st-published); font-size: 0.85rem; }
.err { color: #c0392b; margin: 0 0 12px; }
.grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
.col { background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 12px; padding: 20px; }
.f { display: block; margin-bottom: 14px; }
.f:last-child { margin-bottom: 0; }
.f span { display: block; font-size: 0.8rem; color: var(--dt-muted); margin-bottom: 4px; }
.f input, .f textarea, .f select {
  width: 100%; padding: 9px 12px; border: 1px solid var(--dt-line); border-radius: 8px;
  outline: none; font-size: 0.93rem; color: var(--dt-navy); background: #fff;
}
.f input:focus, .f textarea:focus, .f select:focus { border-color: var(--dt-cyan); }
.f textarea { resize: vertical; }
.mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.82rem; line-height: 1.6; }
.chk { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--dt-navy); margin-bottom: 14px; }
@media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
</style>
