<template>
  <BaseCard>
    <h2 style="margin:0 0 8px;">สมัครสมาชิก</h2>
    <p class="muted" style="margin:0 0 14px;">กรอกข้อมูลเพื่อสร้างบัญชี</p>

    <div style="display:grid; gap:10px;">
      <div>
        <div class="muted" style="font-size:12px; margin-bottom:6px;">Name</div>
        <input v-model="name" type="text" placeholder="ชื่อผู้ใช้" />
      </div>

      <div>
        <div class="muted" style="font-size:12px; margin-bottom:6px;">Username</div>
        <input v-model="username" type="text" placeholder="เช่น user01" />
      </div>

      <div>
        <div class="muted" style="font-size:12px; margin-bottom:6px;">Email</div>
        <input v-model="email" type="email" placeholder="เช่น user@email.com" />
      </div>

      <div>
        <div class="muted" style="font-size:12px; margin-bottom:6px;">Password</div>
        <input v-model="password" type="password" placeholder="อย่างน้อย 4 ตัว" />
      </div>

      <BaseButton :disabled="loading" variant="primary" @click="register">
        สมัครสมาชิก
      </BaseButton>

      <NuxtLink to="/login" class="muted">กลับไปหน้าเข้าสู่ระบบ</NuxtLink>

      <LoadingSpinner v-if="loading" />
      <p v-if="msg" class="muted" style="margin:0;">{{ msg }}</p>
      <p v-if="error" style="color: var(--danger); margin:0;">{{ error }}</p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'login' })

const { request } = useApi()
const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const msg = ref('')

async function register() {
  loading.value = true
  error.value = ''
  msg.value = ''
  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.value,
        username: username.value,
        email: email.value,
        password: password.value
      })
    })
    msg.value = 'สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...'
    setTimeout(() => navigateTo('/login'), 800)
  } catch (e: any) {
    error.value = e?.message || 'สมัครไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
