<template>
  <div class="row" style="margin-top: 12px;">
    <div class="spin" />
    <span class="muted">กำลังประมวลผล...</span>
  </div>
</template>

<style scoped>
.spin{
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: rgba(255,255,255,0.75);
  animation: s 0.7s linear infinite;
}
@keyframes s { to { transform: rotate(360deg); } }
</style>
