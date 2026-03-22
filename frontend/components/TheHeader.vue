<template>
  <header
    style="border-bottom:1px solid var(--line); background: rgba(255,255,255,0.02);"
  >
    <div
      class="container"
      style="display:flex; align-items:center; justify-content:space-between; padding:14px 0;"
    >
      <!-- ฝั่งซ้าย -->
      <div>
        <div style="font-weight:700;">Waste Sorter</div>
        <div class="muted" style="font-size:12px;">คัดแยกขยะจากรูปภาพ</div>
      </div>

      <!-- ฝั่งขวา (เมนู) -->
      <div class="row" style="gap:12px;">
        <NuxtLink to="/" class="muted">หน้าแรก</NuxtLink>
        <NuxtLink to="/history" class="muted">ประวัติ</NuxtLink>
        <NuxtLink to="/profile" class="muted">ข้อมูลส่วนตัว</NuxtLink>
        <NuxtLink to="/live-scan" class="muted">Live Scan</NuxtLink>

        <BaseButton variant="secondary" @click="onLogout">
          ออกจากระบบ
        </BaseButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { logout } = useAuth()

function onLogout() {
  logout()
  navigateTo('/login')
}
</script>
