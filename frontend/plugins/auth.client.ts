export default defineNuxtPlugin(() => {
  const auth = useAuth()
  auth.loadFromStorage()
})
