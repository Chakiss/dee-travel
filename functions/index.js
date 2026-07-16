/**
 * Cloud Function: generateFbContent — production endpoint for AI Facebook copy.
 *
 * Mirrors apps/admin/server/api/fb-generate (dev Nitro route), but as a callable
 * Function so it works on static Firebase Hosting. Enforces the editor/admin
 * custom claim, and keeps the Anthropic key in a Secret (never in the client).
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const AnthropicPkg = require('@anthropic-ai/sdk')
const Anthropic = AnthropicPkg.default || AnthropicPkg

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const POST_TYPE_TH = {
  recommendation: 'แนะนำสถานที่', educational: 'ให้ความรู้', engagement: 'กระตุ้นการมีส่วนร่วม',
  question: 'ตั้งคำถาม', listicle: 'ลิสต์', promotion: 'โปรโมชัน', seasonal: 'เทศกาล/ฤดูกาล', storytelling: 'เล่าเรื่อง',
}
const TONE_TH = {
  friendly: 'เป็นกันเอง', informative: 'ให้ข้อมูล', salesy: 'กระตุ้นยอดขาย', engagement: 'กระตุ้นการมีส่วนร่วม',
}

exports.generateFbContent = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'asia-southeast1', cors: true },
  async (request) => {
    const role = request.auth && request.auth.token && request.auth.token.role
    if (role !== 'admin' && role !== 'editor') {
      throw new HttpsError('permission-denied', 'ต้องมีสิทธิ์ editor ขึ้นไป')
    }

    const { input, postType, tone } = request.data || {}
    if (!input || !input.name) throw new HttpsError('invalid-argument', 'ต้องมีข้อมูลสถานที่')

    const system =
      'คุณเป็นนักเขียนคอนเทนต์การตลาดท่องเที่ยวบน Facebook มืออาชีพสำหรับแบรนด์ "Dee Travel" ' +
      'เขียนภาษาไทยที่เป็นธรรมชาติ น่าสนใจ ชวนออกเดินทาง หลีกเลี่ยงคำโฆษณาเกินจริง ' +
      'ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON'

    const prompt = [
      `สถานที่: ${input.name}`,
      input.provinceName ? `จังหวัด: ${input.provinceName}` : '',
      input.districtName ? `อำเภอ: ${input.districtName}` : '',
      input.excerpt ? `คำโปรย: ${input.excerpt}` : '',
      `ประเภทโพสต์: ${POST_TYPE_TH[postType] || postType}`,
      `โทนเสียง: ${TONE_TH[tone] || tone}`,
      '',
      'สร้างคอนเทนต์ Facebook แล้วตอบเป็น JSON (ทุก field ภาษาไทย ยกเว้น hashtags.en):',
      JSON.stringify({
        headline: 'string', shortDescription: 'string', imageOverlayText: 'string',
        highlights: ['string'], captions: { short: '', long: '', friendly: '', salesy: '', engagement: '' },
        hashtags: { th: ['#...'], en: ['#...'] }, cta: 'string', suggestedAudience: 'string',
      }),
    ].filter(Boolean).join('\n')

    try {
      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() })
      const msg = await client.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = (msg.content.find((b) => b.type === 'text') || {}).text || ''
      const ai = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
      return { content: ai, generatedBy: 'ai' }
    } catch (e) {
      // Let the client fall back to its template engine.
      throw new HttpsError('unavailable', 'AI ไม่พร้อมใช้งาน', { reason: String(e && e.message) })
    }
  },
)
