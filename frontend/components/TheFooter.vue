<template>
  <footer style="border-top:1px solid var(--line); background: rgba(255,255,255,0.02);">
    <div class="container" style="padding: 14px 0;">
      <span class="muted">© {{ year }} Waste Sorter</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
