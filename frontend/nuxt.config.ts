export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: '/api',
    },
  },

  vite: {
    server: {
      allowedHosts: true,

      // ✅ proxy /api -> backend 5000 (dev server)
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
  },
})
