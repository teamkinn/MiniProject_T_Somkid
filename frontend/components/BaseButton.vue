<template>
  <button class="btn" :class="variant" :disabled="disabled" type="button">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'danger'
  }>(),
  { variant: 'secondary' }
)
</script>

<style scoped>
.btn{
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  cursor: pointer;
  transition: transform .02s ease, opacity .2s ease;
}
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.primary{
  background: rgba(110,168,254,0.14);
  border-color: rgba(110,168,254,0.35);
}
.secondary{
  background: rgba(255,255,255,0.03);
}
.danger{
  background: rgba(255,107,107,0.12);
  border-color: rgba(255,107,107,0.35);
}
</style>
