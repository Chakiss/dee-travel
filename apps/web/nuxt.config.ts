// apps/web — public site. SSR/SSG for SEO (the legacy SPA's fatal flaw).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: true },
  typescript: { strict: true },

  // Workspace UI package ships .vue SFCs — Vite must transpile it.
  build: { transpile: ['@deetravel/ui'] },

  // SSG (nuxi generate): crawl all content pages; don't fail the whole build when
  // a place's external website link (rendered in content) 404s as a route.
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/', '/places', '/articles', '/events'],
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      // Legacy brand fonts: Pattaya (display/logo) + Kanit (everything else).
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Pattaya&display=swap',
        },
        { rel: 'icon', type: 'image/png', href: '/brand/icon.png' },
        { rel: 'apple-touch-icon', href: '/brand/icon.png' },
      ],
    },
  },

  // Route rendering: plain SSR for now. Caching (ISR/SWR) is added deliberately
  // in the SEO phase — and must vary by query on the dynamic /places listing,
  // so it is intentionally NOT cached here.
  routeRules: {
    '/places/:slug': { swr: 3600 },
    '/articles/:slug': { swr: 3600 },
    '/events/:slug': { swr: 3600 },
  },

  // Firebase web config is public-by-design. Values are overridden at runtime from
  // NUXT_PUBLIC_* env vars (see .env.example). useEmulator routes to the local suite.
  runtimeConfig: {
    public: {
      useEmulator: false,
      // GA4 measurement ID (e.g. G-XXXX). Set NUXT_PUBLIC_GA_ID to enable analytics.
      gaId: '',
      // Bucket that serves cover images. In dev this points at the real prod
      // bucket (public read) even while Firestore is read from the emulator.
      imageBucket: '',
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      },
    },
  },
})
