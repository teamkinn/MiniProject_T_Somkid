type AuthUser = {
  token: string
  role?: 'user' | 'admin'
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth_user', () => null)

  function setAuth(token: string, role?: 'user' | 'admin') {
    user.value = { token, role }
    if (process.client) {
      localStorage.setItem('token', token)
      if (role) localStorage.setItem('role', role)
    }
  }

  function loadFromStorage() {
    if (!process.client) return
    const token = localStorage.getItem('token')
    const role = (localStorage.getItem('role') as any) || undefined
    if (token) user.value = { token, role }
  }

  function logout() {
    user.value = null
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    }
  }

  const isAuthed = computed(() => !!user.value?.token)
  const isAdmin = computed(() => user.value?.role === 'admin')

  return { user, isAuthed, isAdmin, setAuth, loadFromStorage, logout }
}
