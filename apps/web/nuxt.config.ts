// apps/web — public site. SSR/SSG for SEO (the legacy SPA's fatal flaw).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: true },
  typescript: { strict: true },

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  // Route rendering strategy (Section 2 of docs/ARCHITECTURE.md).
  // Detail pages prerender + ISR; listings SSR. Wired fully in Phase 2.
  routeRules: {
    '/': { swr: 3600 },
    '/places/**': { swr: 3600 },
    '/articles/**': { swr: 3600 },
    '/events/**': { swr: 3600 },
  },

  // Firebase web config is public-by-design; real values injected via env in Phase 1.
  runtimeConfig: {
    public: {
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
      },
    },
  },
})
