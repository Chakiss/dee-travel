// apps/web — public site. SSR/SSG for SEO (the legacy SPA's fatal flaw).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  devtools: { enabled: true },
  typescript: { strict: true },

  // Workspace UI package ships .vue SFCs — Vite must transpile it.
  build: { transpile: ['@deetravel/ui'] },

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
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
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
