<template>
  <BaseCard>
    <h2 style="margin:0 0 8px;">ตั้งรหัสผ่านใหม่</h2>
    <p class="muted" style="margin:0 0 14px;">กรอก Email + Reset Token + รหัสผ่านใหม่</p>

    <div style="display:grid; gap:10px;">
      <div>
        <label class="muted">Email</label>
        <input v-model="email" type="email" placeholder="เช่น user@email.com" />
      </div>

      <div>
        <label class="muted">Reset Token</label>
        <input v-model="resetToken" type="text" placeholder="token จากหน้า ลืมรหัสผ่าน" />
      </div>

      <div>
        <label class="muted">New Password</label>
        <input v-model="newPassword" type="password" placeholder="อย่างน้อย 8 ตัว" />
      </div>

      <BaseButton :disabled="loading" variant="primary" @click="submit">
        เปลี่ยนรหัสผ่าน
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

const route = useRoute()
const { request } = useApi()

// ✅ รับค่าจาก query ได้เลย: /reset-password?email=...&token=...
const email = ref(String(route.query.email || ''))
const resetToken = ref(String(route.query.token || ''))
const newPassword = ref('')

const loading = ref(false)
const error = ref('')
const msg = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  msg.value = ''

  try {
    if (!email.value || !resetToken.value || !newPassword.value) {
      throw new Error('กรอกข้อมูลให้ครบก่อน')
    }
    if (newPassword.value.length < 8) {
      throw new Error('รหัสผ่านใหม่ต้องอย่างน้อย 8 ตัว')
    }

    // ✅ ส่ง body เป็น object ไม่ต้อง JSON.stringify
    const res = await request<any>('/auth/reset-password', {
      method: 'POST',
      body: {
        email: email.value,
        resetToken: resetToken.value,
        newPassword: newPassword.value
      }
    })

    msg.value = res?.message || 'เปลี่ยนรหัสผ่านแล้ว'
    setTimeout(() => navigateTo('/login'), 800)
  } catch (e: any) {
    // ✅ รองรับ error รูปแบบต่าง ๆ
    error.value =
      e?.data?.message ||
      e?.message ||
      'เปลี่ยนรหัสผ่านไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
