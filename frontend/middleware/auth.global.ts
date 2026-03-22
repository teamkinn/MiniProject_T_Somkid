export default defineNuxtRouteMiddleware((to) => {
  // กัน SSR อ่าน localStorage ไม่ได้
  if (process.server) return

  if (to.path === '/login' || to.path === '/register' || to.path === '/forgot-password' || to.path === '/reset-password') return

  const { isAuthed } = useAuth()
  if (!isAuthed.value) return navigateTo('/login')
})
