<template>
  <BaseCard>
    <h2 style="margin:0 0 8px;">ลืมรหัสผ่าน</h2>
    <p class="muted" style="margin:0 0 14px;">
      *หมายเหตุ:* ระบบไม่สามารถส่ง "รหัสผ่านเดิม" ให้ได้ เพราะเก็บแบบเข้ารหัส (hash)
      <br />
      หน้านี้จะขออีเมลเพื่อ "สร้างโทเคนรีเซ็ต" (จำลอง) แล้วให้คุณนำไปตั้งรหัสใหม่
    </p>

    <div style="display:grid; gap:10px;">
      <div>
        <label class="muted">Email</label>
        <input v-model="email" type="email" placeholder="เช่น user@email.com" />
      </div>

      <BaseButton :disabled="loading" variant="primary" @click="submit">
        ขอรีเซ็ตรหัสผ่าน
      </BaseButton>

      <NuxtLink to="/login" class="muted">กลับไปหน้าเข้าสู่ระบบ</NuxtLink>

      <LoadingSpinner v-if="loading" />
      <p v-if="msg" class="muted" style="margin:0;">{{ msg }}</p>
      <p v-if="resetToken" style="margin:0;">
        <b>Reset Token (สำหรับเดโม):</b> {{ resetToken }}
      </p>
      <p v-if="error" style="color: var(--danger); margin:0;">{{ error }}</p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'login' })

const { request } = useApi()
const email = ref('')
const loading = ref(false)
const error = ref('')
const msg = ref('')
const resetToken = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  msg.value = ''
  resetToken.value = ''
  try {
    const res = await request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.value })
    })
    msg.value = res?.message || 'ส่งคำขอแล้ว'
    if (res?.resetToken) resetToken.value = res.resetToken
  } catch (e: any) {
    error.value = e?.message || 'ทำรายการไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>
