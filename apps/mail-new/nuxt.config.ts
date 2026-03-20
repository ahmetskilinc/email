export default defineNuxtConfig({
  srcDir: '.',
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      backendUrl:
        process.env.NUXT_PUBLIC_BACKEND_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.VITE_PUBLIC_BACKEND_URL ||
        'http://localhost:8787',
      appUrl:
        process.env.NUXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.VITE_PUBLIC_APP_URL ||
        'http://localhost:3000',
    },
  },
  routeRules: {
    '/': { redirect: '/login' },
    '/mail': { redirect: '/mail/inbox' },
    '/settings': { redirect: '/settings/general' },
  },
});
