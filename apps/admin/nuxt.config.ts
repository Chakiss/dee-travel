// apps/admin — CMS + Facebook Marketing Toolkit. SPA (no SEO need, behind auth).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  typescript: { strict: true },

  build: { transpile: ['@deetravel/ui'] },
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'Dee Travel Admin',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Pattaya&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Server-only (never exposed to the client). Set NUXT_ANTHROPIC_API_KEY to
    // enable AI generation; leave empty to fall back to the template engine.
    anthropicApiKey: '',
    public: {
      useEmulator: false,
      // Public site base URL — used to build the shareable link for a place.
      siteUrl: 'https://deetravel-app.web.app',
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
