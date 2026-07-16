import Anthropic from '@anthropic-ai/sdk'
import {
  generateFacebookContent,
  type MarketingInput,
  type GenerateOptions,
  type GeneratedContent,
} from '@deetravel/marketing'

interface Payload {
  input: MarketingInput
  postType: GenerateOptions['postType']
  tone: GenerateOptions['tone']
}

const POST_TYPE_TH: Record<string, string> = {
  recommendation: 'แนะนำสถานที่', educational: 'ให้ความรู้', engagement: 'กระตุ้นการมีส่วนร่วม',
  question: 'ตั้งคำถาม', listicle: 'ลิสต์', promotion: 'โปรโมชัน', seasonal: 'เทศกาล/ฤดูกาล', storytelling: 'เล่าเรื่อง',
}
const TONE_TH: Record<string, string> = {
  friendly: 'เป็นกันเอง', informative: 'ให้ข้อมูล', salesy: 'กระตุ้นยอดขาย', engagement: 'กระตุ้นการมีส่วนร่วม',
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Payload>(event)
  const opts: GenerateOptions = { postType: body.postType, tone: body.tone }

  // Deterministic template is both the fallback and the structural base
  // (creativeFormat / imageSpec stay template-driven; AI fills the copy).
  const template = generateFacebookContent(body.input, opts)

  const apiKey = useRuntimeConfig(event).anthropicApiKey as string

  const system =
    'คุณเป็นนักเขียนคอนเทนต์การตลาดท่องเที่ยวบน Facebook มืออาชีพสำหรับแบรนด์ "Dee Travel" ' +
    'เขียนภาษาไทยที่เป็นธรรมชาติ น่าสนใจ ชวนออกเดินทาง หลีกเลี่ยงคำโฆษณาเกินจริง ' +
    'ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON'

  const p = body.input
  const prompt = [
    `สถานที่: ${p.name}`,
    p.provinceName ? `จังหวัด: ${p.provinceName}` : '',
    p.districtName ? `อำเภอ: ${p.districtName}` : '',
    p.excerpt ? `คำโปรย: ${p.excerpt}` : '',
    `ประเภทโพสต์: ${POST_TYPE_TH[body.postType] ?? body.postType}`,
    `โทนเสียง: ${TONE_TH[body.tone] ?? body.tone}`,
    '',
    'สร้างคอนเทนต์ Facebook แล้วตอบเป็น JSON ตามรูปแบบนี้ (ทุก field เป็นภาษาไทย ยกเว้น hashtags.en):',
    JSON.stringify({
      headline: 'string',
      shortDescription: 'string (<=90 ตัวอักษร)',
      imageOverlayText: 'string (สั้น ใส่บนรูปได้)',
      highlights: ['string', 'string', 'string'],
      captions: { short: 'string', long: 'string', friendly: 'string', salesy: 'string', engagement: 'string' },
      hashtags: { th: ['#...'], en: ['#...'] },
      cta: 'string',
      suggestedAudience: 'string',
    }),
  ].filter(Boolean).join('\n')

  try {
    const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic()
    const msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = msg.content.find((b) => b.type === 'text') as { text: string } | undefined
    const raw = textBlock?.text ?? ''
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    const ai = JSON.parse(json)

    const merged: GeneratedContent = {
      ...template,
      headline: ai.headline ?? template.headline,
      shortDescription: ai.shortDescription ?? template.shortDescription,
      imageOverlayText: ai.imageOverlayText ?? template.imageOverlayText,
      highlights: Array.isArray(ai.highlights) && ai.highlights.length ? ai.highlights : template.highlights,
      captions: { ...template.captions, ...(ai.captions ?? {}) },
      hashtags: {
        th: ai.hashtags?.th?.length ? ai.hashtags.th : template.hashtags.th,
        en: ai.hashtags?.en?.length ? ai.hashtags.en : template.hashtags.en,
      },
      cta: ai.cta ?? template.cta,
      suggestedAudience: ai.suggestedAudience ?? template.suggestedAudience,
    }
    return { content: merged, generatedBy: 'ai' as const }
  } catch (err) {
    // No API key / auth / parse failure → deterministic template still works.
    const reason = (err as { status?: number })?.status === 401 ? 'no_api_key' : 'ai_failed'
    return { content: template, generatedBy: 'template' as const, reason }
  }
})
