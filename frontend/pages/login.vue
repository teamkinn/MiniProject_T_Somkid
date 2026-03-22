<template>
  <BaseCard>
    <h2 style="margin:0 0 8px;">เข้าสู่ระบบ</h2>
    <p class="muted" style="margin:0 0 14px;">
      กรอก username / password เพื่อรับ token
    </p>

    <div style="display:grid; gap:10px;">
      <div>
        <label class="muted">Username หรือ Email</label>
        <input v-model="identifier" type="text" placeholder="เช่น admin หรือ user@email.com" />
      </div>

      <div>
        <label class="muted">Password</label>
        <input v-model="password" type="password" />
      </div>

      <BaseButton :disabled="loading" variant="primary" @click="login">
        เข้าสู่ระบบ
      </BaseButton>
      <NuxtLink to="/register" class="muted">ยังไม่มีบัญชี? สมัครสมาชิก</NuxtLink>
      <NuxtLink to="/forgot-password" class="muted">ลืมรหัสผ่าน?</NuxtLink>

      <LoadingSpinner v-if="loading" />
      <p v-if="error" style="color: var(--danger); margin:0;">
        {{ error }}
      </p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'login'
})

const { request } = useApi()
const { setToken, isAuthed } = useAuth()

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

type LoginResponse = {
  token: string
  user?: { id: string; username: string; name: string; email: string; role: 'user' | 'admin' }
}

onMounted(() => {
  if (isAuthed.value) navigateTo('/')
})

async function login() {
  loading.value = true
  error.value = ''
  try {
    const res = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.value,
        password: password.value
      })
    })


    const { setAuth } = useAuth()
    setAuth(res.token, res.user?.role)
    navigateTo('/')

    navigateTo('/')
  } catch (e: any) {
    error.value = e?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
