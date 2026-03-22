<template>
  <BaseCard>
    <h2 style="margin:0 0 8px;">ข้อมูลส่วนตัว</h2>
    <p class="muted" style="margin:0 0 14px;">ดูและแก้ไขข้อมูลผู้ใช้งาน</p>

    <LoadingSpinner v-if="loading" />
    <p v-if="error" style="color:var(--danger); margin:0 0 10px;">{{ error }}</p>

    <div v-if="me" style="display:grid; gap:12px;">
      <!-- แสดงข้อมูล (ตามโจทย์: username/name/password/email) -->
      <BaseCard>
        <div style="display:grid; gap:6px;">
          <div><b>Username:</b> {{ me.username }}</div>
          <div><b>Name:</b> {{ me.name }}</div>
          <div><b>Email:</b> {{ me.email }}</div>
          <div><b>Password:</b> ********</div>
          <div class="muted" style="font-size:12px;">Role: {{ me.role }}</div>
        </div>
      </BaseCard>

      <!-- แก้ไขข้อมูลส่วนตัว -->
      <BaseCard>
        <h3 style="margin:0 0 10px;">แก้ไขข้อมูลส่วนตัว</h3>
        <div style="display:grid; gap:10px;">
          <div>
            <div class="muted" style="font-size:12px; margin-bottom:6px;">Name</div>
            <input v-model="form.name" type="text" />
          </div>
          <div>
            <div class="muted" style="font-size:12px; margin-bottom:6px;">Username</div>
            <input v-model="form.username" type="text" />
          </div>
          <div>
            <div class="muted" style="font-size:12px; margin-bottom:6px;">Email</div>
            <input v-model="form.email" type="email" />
          </div>

          <BaseButton :disabled="busy" variant="primary" @click="saveProfile">
            บันทึกข้อมูล
          </BaseButton>

          <p v-if="msgProfile" class="muted" style="margin:0;">{{ msgProfile }}</p>
        </div>
      </BaseCard>

      <!-- เปลี่ยนรหัสผ่าน -->
      <BaseCard>
        <h3 style="margin:0 0 10px;">เปลี่ยนรหัสผ่าน</h3>
        <div style="display:grid; gap:10px;">
          <div>
            <div class="muted" style="font-size:12px; margin-bottom:6px;">Current password</div>
            <input v-model="pwd.current" type="password" />
          </div>
          <div>
            <div class="muted" style="font-size:12px; margin-bottom:6px;">New password</div>
            <input v-model="pwd.next" type="password" placeholder="อย่างน้อย 8 ตัว" />
          </div>

          <BaseButton :disabled="busy" variant="secondary" @click="changePassword">
            เปลี่ยนรหัสผ่าน
          </BaseButton>

          <p v-if="msgPassword" class="muted" style="margin:0;">{{ msgPassword }}</p>
        </div>
      </BaseCard>
    </div>

    <NuxtLink to="/" class="muted" style="display:inline-block; margin-top:10px;">
      กลับหน้าแรก
    </NuxtLink>
  </BaseCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { request } = useApi()

const loading = ref(true)
const busy = ref(false)
const error = ref('')

type Me = {
  _id: string
  username: string
  name: string
  email: string
  role: 'user' | 'admin'
}

const me = ref<Me | null>(null)
const form = reactive({ username: '', name: '', email: '' })
const pwd = reactive({ current: '', next: '' })

const msgProfile = ref('')
const msgPassword = ref('')

async function loadMe() {
  loading.value = true
  error.value = ''
  try {
    const data = await request<Me>('/me')
    me.value = data
    form.username = data.username
    form.name = data.name
    form.email = data.email
  } catch (e: any) {
    error.value = e?.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  if (!me.value) return
  busy.value = true
  msgProfile.value = ''
  try {
    const updated = await request<Me>('/me', {
      method: 'PUT',
      body: JSON.stringify({
        username: form.username,
        name: form.name,
        email: form.email
      })
    })
    me.value = updated
    msgProfile.value = 'บันทึกข้อมูลแล้ว'
  } catch (e: any) {
    msgProfile.value = e?.message || 'บันทึกไม่สำเร็จ'
  } finally {
    busy.value = false
  }
}

async function changePassword() {
  busy.value = true
  msgPassword.value = ''
  try {
    await request('/me/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: pwd.current,
        newPassword: pwd.next
      })
    })
    pwd.current = ''
    pwd.next = ''
    msgPassword.value = 'เปลี่ยนรหัสผ่านแล้ว'
  } catch (e: any) {
    msgPassword.value = e?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ'
  } finally {
    busy.value = false
  }
}

onMounted(loadMe)
</script>
