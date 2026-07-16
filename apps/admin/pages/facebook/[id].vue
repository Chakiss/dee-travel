<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'
import type { Place } from '@deetravel/types'
import {
  generateFacebookContent, POST_TYPES, TONES,
  type PostType, type Tone, type GeneratedContent,
} from '@deetravel/marketing'

const route = useRoute()
const id = String(route.params.id)
const { db, toPlain } = useFirebase()

const { data: place } = await useAsyncData(`fb-${id}`, async () => {
  const snap = await getDoc(doc(db, 'places', id))
  if (!snap.exists()) throw createError({ statusCode: 404, statusMessage: 'ไม่พบสถานที่' })
  return toPlain<Place>({ id: snap.id, ...snap.data() })
})

useHead(() => ({ title: `Facebook · ${place.value?.name} — Dee Travel Admin` }))

const postType = ref<PostType>('recommendation')
const tone = ref<Tone>('friendly')

function marketingInput() {
  const p = place.value!
  return { name: p.name, excerpt: p.excerpt, provinceName: p.provinceName, districtName: p.districtName, type: p.type }
}

// Template engine is the default + fallback; AI result (if generated) overrides it.
const templateContent = computed<GeneratedContent | null>(() =>
  place.value
    ? generateFacebookContent(marketingInput(), { postType: postType.value, tone: tone.value })
    : null,
)
const aiContent = ref<GeneratedContent | null>(null)
const generatedBy = ref<'template' | 'ai'>('template')
const generating = ref(false)
const genError = ref('')

const content = computed(() => aiContent.value ?? templateContent.value)

// Changing type/tone reverts to the template until AI is run again.
watch([postType, tone], () => {
  aiContent.value = null
  generatedBy.value = 'template'
  genError.value = ''
})

async function generateAI() {
  if (!place.value) return
  generating.value = true
  genError.value = ''
  try {
    const res = await $fetch<{ content: GeneratedContent; generatedBy: 'ai' | 'template'; reason?: string }>(
      '/api/fb-generate',
      { method: 'POST', body: { input: marketingInput(), postType: postType.value, tone: tone.value } },
    )
    aiContent.value = res.content
    generatedBy.value = res.generatedBy
    if (res.generatedBy === 'template') {
      genError.value = res.reason === 'no_api_key'
        ? 'ยังไม่ได้ตั้งค่า Anthropic API key — ใช้ผลจาก template แทน'
        : 'AI ไม่พร้อมใช้งาน — ใช้ผลจาก template แทน'
    }
  } catch {
    genError.value = 'เรียก AI ไม่สำเร็จ'
  } finally {
    generating.value = false
  }
}

const captionList = computed(() => {
  const c = content.value
  if (!c) return []
  return [
    { key: 'short', label: 'แคปชันสั้น', text: c.captions.short },
    { key: 'long', label: 'แคปชันยาว', text: c.captions.long },
    { key: 'friendly', label: 'เป็นกันเอง', text: c.captions.friendly },
    { key: 'salesy', label: 'กระตุ้นยอดขาย', text: c.captions.salesy },
    { key: 'engagement', label: 'กระตุ้น Engagement', text: c.captions.engagement },
  ]
})

const copied = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
async function copy(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = ''), 1500)
  } catch {
    copied.value = ''
  }
}
</script>

<template>
  <div v-if="content && place" class="fb">
    <NuxtLink :to="`/places/${id}`" class="back">← กลับไปแก้ไข</NuxtLink>

    <header class="head">
      <div>
        <p class="eyebrow">DeeSocial</p>
        <h1>สร้างคอนเทนต์ Facebook</h1>
        <p class="sub">{{ place.name }}</p>
      </div>
    </header>

    <section class="controls">
      <label>
        <span>ประเภทโพสต์</span>
        <select v-model="postType">
          <option v-for="p in POST_TYPES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </label>
      <label>
        <span>โทนเสียง</span>
        <select v-model="tone">
          <option v-for="t in TONES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </label>
      <button class="ai-btn" :disabled="generating" @click="generateAI">
        {{ generating ? 'กำลังสร้าง…' : '✦ สร้างด้วย AI' }}
      </button>
      <span class="src" :class="generatedBy">{{ generatedBy === 'ai' ? 'สร้างโดย AI' : 'จาก template' }}</span>
    </section>

    <p v-if="genError" class="gen-note">{{ genError }}</p>

    <div class="cols">
      <section class="captions">
        <div v-for="c in captionList" :key="c.key" class="cap">
          <div class="cap-head">
            <span class="cap-label">{{ c.label }}</span>
            <button class="copy" :class="{ ok: copied === c.key }" @click="copy(c.key, c.text)">
              {{ copied === c.key ? 'คัดลอกแล้ว ✓' : 'คัดลอก' }}
            </button>
          </div>
          <pre class="cap-text">{{ c.text }}</pre>
        </div>
      </section>

      <aside class="meta">
        <div class="block">
          <h3>Hashtag</h3>
          <div class="tags">{{ content.hashtags.th.join(' ') }}</div>
          <div class="tags en">{{ content.hashtags.en.join(' ') }}</div>
          <button class="copy sm" :class="{ ok: copied === 'tags' }"
            @click="copy('tags', [...content.hashtags.th, ...content.hashtags.en].join(' '))">
            {{ copied === 'tags' ? 'คัดลอกแล้ว ✓' : 'คัดลอกแฮชแท็ก' }}
          </button>
        </div>

        <div class="block">
          <h3>Call to action</h3>
          <p class="val">{{ content.cta }}</p>
        </div>

        <div class="block">
          <h3>ไฮไลต์</h3>
          <ul><li v-for="h in content.highlights" :key="h">{{ h }}</li></ul>
        </div>

        <div class="block grid2">
          <div><span class="k">รูปแบบ</span><span class="v">{{ content.creativeFormat }}</span></div>
          <div><span class="k">ขนาดภาพ</span><span class="v">{{ content.imageSpec.ratio }} · {{ content.imageSpec.size }}</span></div>
          <div class="full"><span class="k">ข้อความบนรูป</span><span class="v">{{ content.imageOverlayText }}</span></div>
          <div class="full"><span class="k">กลุ่มเป้าหมาย</span><span class="v small">{{ content.suggestedAudience }}</span></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.back { color: var(--dt-cyan-d); font-weight: 500; font-size: 0.9rem; }
.head { margin: 0.8rem 0 1.4rem; }
.eyebrow { font-family: var(--font-display); color: var(--dt-cyan); margin: 0; font-size: 1.05rem; }
h1 { font-size: 1.6rem; font-weight: 600; color: var(--dt-navy); margin: 0.1em 0 0; }
.sub { color: var(--dt-muted); margin: 0.2rem 0 0; }
.controls { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.controls label { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--dt-muted); }
.controls select {
  padding: 9px 12px; border: 1px solid var(--dt-line); border-radius: 8px;
  font-size: 0.95rem; color: var(--dt-navy); background: #fff; min-width: 200px;
}
.controls select:focus { outline: none; border-color: var(--dt-cyan); }
.controls { align-items: flex-end; }
.ai-btn {
  align-self: flex-end; border: 0; border-radius: 8px; cursor: pointer;
  font-family: var(--font-body); font-weight: 500; font-size: 0.92rem; color: #fff;
  background: linear-gradient(135deg, var(--dt-cyan), var(--dt-cyan-d)); padding: 10px 18px;
}
.ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.src { align-self: flex-end; font-size: 0.76rem; font-weight: 500; padding: 5px 10px; border-radius: 100px; }
.src.ai { color: var(--dt-cyan-d); background: var(--st-scheduled-bg); }
.src.template { color: var(--dt-muted); background: var(--dt-surface-2); }
.gen-note { color: var(--dt-muted); font-size: 0.85rem; margin: -8px 0 12px; }
.cols { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
.captions { display: flex; flex-direction: column; gap: 12px; }
.cap { background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 12px; padding: 14px 16px; }
.cap-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cap-label { font-weight: 500; font-size: 0.85rem; color: var(--dt-navy); }
.cap-text {
  margin: 0; white-space: pre-wrap; font-family: var(--font-body); font-weight: 300;
  font-size: 0.92rem; line-height: 1.7; color: var(--dt-ink);
}
.copy {
  border: 1px solid var(--dt-line); background: #fff; color: var(--dt-cyan-d);
  font-size: 0.78rem; font-weight: 500; padding: 4px 12px; border-radius: 100px; cursor: pointer;
}
.copy:hover { border-color: var(--dt-cyan); }
.copy.ok { color: var(--st-published); border-color: var(--st-published); }
.copy.sm { margin-top: 10px; }
.meta { display: flex; flex-direction: column; gap: 12px; }
.block { background: var(--dt-surface); border: 1px solid var(--dt-line); border-radius: 12px; padding: 14px 16px; }
.block h3 { margin: 0 0 8px; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--dt-muted); }
.tags { color: var(--dt-cyan-d); font-size: 0.9rem; line-height: 1.6; }
.tags.en { color: var(--dt-muted); margin-top: 4px; }
.val { margin: 0; color: var(--dt-navy); }
.block ul { margin: 0; padding-left: 18px; color: var(--dt-ink); font-size: 0.9rem; }
.block ul li { margin: 3px 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.grid2 .full { grid-column: 1 / -1; }
.grid2 .k { display: block; font-size: 0.72rem; color: var(--dt-muted); }
.grid2 .v { color: var(--dt-navy); font-size: 0.92rem; }
.grid2 .v.small { font-size: 0.82rem; line-height: 1.5; }
@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
</style>
