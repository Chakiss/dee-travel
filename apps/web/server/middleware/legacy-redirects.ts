// 301 redirects from the legacy Vue-2 site's URLs to the new routes, so inbound
// links and Google's index survive the cutover. Detail slugs are preserved;
// listing/section pages map to the closest new page.
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/place\/(.+)$/, (m) => `/places/${m[1]}`],
  [/^\/article\/(.+)$/, (m) => `/articles/${m[1]}`],
  [/^\/event\/(.+)$/, (m) => `/events/${m[1]}`],
  [/^\/home\/?$/, () => '/'],
  [/^\/(?:province|district|subdistrict|geography)\/.+$/, () => '/places'],
  [/^\/(?:destinations|activities|plans|agencies)\/?$/, () => '/places'],
  [/^\/(?:stories|trips)\/?$/, () => '/articles'],
  [/^\/(?:about|contact|auth)\/?$/, () => '/'],
]

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0]
  for (const [re, to] of RULES) {
    const m = path.match(re)
    if (m) return sendRedirect(event, to(m), 301)
  }
})
