// Google Analytics 4 — loads only when NUXT_PUBLIC_GA_ID is set. Client-only.
export default defineNuxtPlugin(() => {
  const gaId = useRuntimeConfig().public.gaId as string
  if (!gaId) return

  useHead({
    script: [
      { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
    ],
  })

  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', gaId, { send_page_view: false })

  // Track SPA route changes as page views.
  const router = useRouter()
  router.afterEach((to) => {
    w.gtag('event', 'page_view', { page_path: to.fullPath })
  })
})
