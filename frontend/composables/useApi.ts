// frontend/composables/useApi.ts
export function useApi() {
  const { user, logout } = useAuth()
  const config = useRuntimeConfig()

  async function request<T>(path: string, opts: RequestInit & { body?: any } = {}): Promise<T> {
    const headers = new Headers(opts.headers || {})

    // ✅ ถ้า body เป็น object ธรรมดา ให้ stringify อัตโนมัติ
    let body = opts.body
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    const isBlob = typeof Blob !== 'undefined' && body instanceof Blob
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer

    if (body && typeof body === 'object' && !isFormData && !isBlob && !isArrayBuffer) {
      body = JSON.stringify(body)
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    }

    // ถ้า body เป็น string แต่ยังไม่มี content-type ก็ตั้งให้
    if (typeof body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (user.value?.token) {
      headers.set('Authorization', `Bearer ${user.value.token}`)
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const url = `${config.public.apiBase}${cleanPath}`

    const res = await fetch(url, {
      ...opts,
      body,
      headers,
      cache: 'no-store',
    })

    if (res.status === 401) {
      logout()
      throw new Error('Session หมดอายุ')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `API ${res.status}`)
    }

    // ✅ กันเคส 204 No Content
    if (res.status === 204) return undefined as T

    // ✅ กันเคส backend ส่ง text/html หรือ text/plain
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(() => '')
      return text as unknown as T
    }

    return res.json()
  }

  return { request }
}
