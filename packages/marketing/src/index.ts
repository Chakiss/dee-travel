/**
 * @deetravel/marketing — deterministic Facebook content generator (Phase 4).
 *
 * Pure, framework-free, unit-testable templates. No AI/API calls: given a place
 * and a chosen post type + tone, it composes ready-to-post Thai copy. Phase 5
 * can later swap the caption strings for Claude output using the same shape.
 */
import type { PostType, Tone, CreativeFormat } from '@deetravel/types'

export type { PostType, Tone, CreativeFormat }

export interface MarketingInput {
  name: string
  excerpt?: string
  provinceName?: string
  districtName?: string
  /** place type (attraction/restaurant/cafe/hotel/activity) if known */
  type?: string
}

export interface GenerateOptions {
  postType: PostType
  tone: Tone
}

export interface GeneratedContent {
  postType: PostType
  tone: Tone
  headline: string
  shortDescription: string
  imageOverlayText: string
  highlights: string[]
  captions: {
    short: string
    long: string
    friendly: string
    salesy: string
    engagement: string
  }
  hashtags: { th: string[]; en: string[] }
  cta: string
  creativeFormat: CreativeFormat
  suggestedAudience: string
  imageSpec: { ratio: '1:1' | '4:5' | '9:16'; size: string }
}

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'recommendation', label: 'แนะนำสถานที่' },
  { value: 'educational', label: 'ให้ความรู้' },
  { value: 'engagement', label: 'กระตุ้นมีส่วนร่วม' },
  { value: 'question', label: 'ตั้งคำถาม' },
  { value: 'listicle', label: 'ลิสต์ (Listicle)' },
  { value: 'promotion', label: 'โปรโมชัน' },
  { value: 'seasonal', label: 'เทศกาล/ฤดูกาล' },
  { value: 'storytelling', label: 'เล่าเรื่อง' },
]

export const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'เป็นกันเอง' },
  { value: 'informative', label: 'ให้ข้อมูล' },
  { value: 'salesy', label: 'กระตุ้นยอดขาย' },
  { value: 'engagement', label: 'กระตุ้นการมีส่วนร่วม' },
]

const TYPE_WORD: Record<string, string> = {
  attraction: 'สถานที่ท่องเที่ยว',
  restaurant: 'ร้านอาหาร',
  cafe: 'คาเฟ่',
  hotel: 'ที่พัก',
  activity: 'กิจกรรม',
}

const CTA: Record<PostType, string> = {
  recommendation: 'บันทึกโพสต์นี้ไว้ แล้วออกเดินทางกัน 📍',
  educational: 'เซฟไว้อ่าน แล้วแชร์ให้เพื่อนสายเที่ยว 🔖',
  engagement: 'คอมเมนต์บอกเราหน่อย อยากไปไหม? 👇',
  question: 'มาตอบกันในคอมเมนต์เลย 💭',
  listicle: 'อ่านครบทุกข้อแล้วเลือกที่ถูกใจ 👉',
  promotion: 'ทักแชทจองเลย ก่อนโปรจะหมด! 💬',
  seasonal: 'วางแผนเที่ยวช่วงนี้กันเลย 🗓️',
  storytelling: 'อ่านเรื่องราวเต็ม ๆ แล้วไปสัมผัสเอง 📖',
}

const FORMAT: Record<PostType, CreativeFormat> = {
  recommendation: 'single',
  educational: 'carousel',
  engagement: 'single',
  question: 'single',
  listicle: 'carousel',
  promotion: 'single',
  seasonal: 'reel',
  storytelling: 'reel',
}

function place(input: MarketingInput) {
  const where = input.provinceName ? `จังหวัด${input.provinceName}` : 'เมืองไทย'
  const kind = (input.type && TYPE_WORD[input.type]) || 'ที่เที่ยว'
  return { where, kind }
}

function deriveHighlights(input: MarketingInput): string[] {
  const raw = (input.excerpt ?? '').split(/[,·]|และ|\|/).map((s) => s.trim()).filter(Boolean)
  const base = raw.slice(0, 3)
  if (base.length) return base
  const { kind, where } = place(input)
  return [`${kind}น่าสนใจใน${where}`, 'บรรยากาศดี ถ่ายรูปสวย', 'เดินทางสะดวก ไปได้ทั้งครอบครัว']
}

function slugish(s: string) {
  return s.replace(/\s+/g, '')
}

function buildHashtags(input: MarketingInput) {
  const th = [
    `#เที่ยว${input.provinceName ? slugish(input.provinceName) : 'ไทย'}`,
    `#${slugish(input.name)}`,
    '#เที่ยวไทย',
    '#เที่ยวให้สุด',
    '#DeeTravel',
  ]
  if (input.districtName) th.splice(2, 0, `#${slugish(input.districtName)}`)
  const en = ['#Thailand', '#Travel', '#ThaiTravel', '#Wanderlust', '#DeeTravel', '#VisitThailand']
  return { th: [...new Set(th)].slice(0, 6), en: [...new Set(en)].slice(0, 6) }
}

function audience(input: MarketingInput) {
  const { where } = place(input)
  return `นักท่องเที่ยวสายเที่ยวไทย อายุ 25–45 ปี สนใจ${where} และการเดินทางในประเทศ`
}

/** Generate a full Facebook content pack for one place. */
export function generateFacebookContent(
  input: MarketingInput,
  options: GenerateOptions,
): GeneratedContent {
  const { where, kind } = place(input)
  const name = input.name.trim()
  const highlights = deriveHighlights(input)
  const lead = input.excerpt?.trim() || `${kind}น่าไปใน${where}`
  const emoji = options.tone === 'friendly' ? '✨' : options.tone === 'salesy' ? '🔥' : '📍'

  const headline = `${name} · ${where}`
  const shortDescription = lead.length > 90 ? `${lead.slice(0, 87)}…` : lead
  const imageOverlayText = name

  const bullets = highlights.map((h) => `• ${h}`).join('\n')
  const tags = buildHashtags(input)
  const tagLine = tags.th.slice(0, 4).join(' ')

  const captions = {
    short: `${emoji} ${name} — ${lead}\n${CTA[options.postType]}`,
    long:
      `${emoji} ${name} ${where}\n\n${lead}\n\nไฮไลต์ที่ห้ามพลาด:\n${bullets}\n\n${CTA[options.postType]}\n\n${tagLine}`,
    friendly:
      `ใครยังไม่เคยไป ${name} ต้องรีบไปแล้วนะ 🥰\n${lead}\nไปกันมั้ย? บอกเพื่อนที่อยากชวนในคอมเมนต์เลย 👇`,
    salesy:
      `🔥 ห้ามพลาด! ${name} ${where}\n${lead}\n${highlights[0] ? `✅ ${highlights[0]}` : ''}\n${CTA.promotion}`,
    engagement:
      `📣 ถ้าให้เลือกไป ${name} กับใครดี? 🤔\n${lead}\nแท็กคนนั้นมาเลย แล้วนัดไปเที่ยวกัน! 👇`,
  }

  const postAngle: Record<PostType, string> = {
    recommendation: `แนะนำ ${name} — ${lead}`,
    educational: `รู้หรือไม่? ${name} ${where} — ${lead}`,
    engagement: captions.engagement,
    question: `คำถามวันนี้: อยากไป ${name} ${where} ไหม? เพราะอะไร? 💭`,
    listicle: `${name} 1 ในที่เที่ยวห้ามพลาดของ${where} — ${lead}`,
    promotion: `🔥 ห้ามพลาด! ${name} ${where} — ${lead}`,
    seasonal: `ช่วงนี้ไป ${name} ${where} กำลังดี ${emoji} ${lead}`,
    storytelling: `เรื่องเล่าจาก ${name}… ${lead}`,
  }
  // Post-type sets the "short" caption angle; tone already colored the wording.
  captions.short = `${postAngle[options.postType]}\n${CTA[options.postType]}`

  const ratio = FORMAT[options.postType] === 'reel' ? '9:16' : '4:5'
  return {
    postType: options.postType,
    tone: options.tone,
    headline,
    shortDescription,
    imageOverlayText,
    highlights,
    captions,
    hashtags: tags,
    cta: CTA[options.postType],
    creativeFormat: FORMAT[options.postType],
    suggestedAudience: audience(input),
    imageSpec: { ratio, size: ratio === '9:16' ? '1080x1920' : '1080x1350' },
  }
}
