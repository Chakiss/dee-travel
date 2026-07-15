// apps/web — public site. SSR/SSG for SEO (the legacy SPA's fatal flaw).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: true },
  typescript: { strict: true },

  // Workspace UI package ships .vue SFCs — Vite must transpile it.
  build: { transpile: ['@deetravel/ui'] },

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

  // Firebase web config is public-by-design. Values are overridden at runtime from
  // NUXT_PUBLIC_* env vars (see .env.example). useEmulator routes to the local suite.
  runtimeConfig: {
    public: {
      useEmulator: false,
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
