<template>
  <div style="display:grid; gap:12px;">
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <input
        type="file"
        accept="image/*"
        multiple
        @change="onPick"
      />
      <button
        class="btn"
        :disabled="loading || files.length === 0"
        @click="uploadBatch"
      >
        {{ loading ? "กำลังวิเคราะห์..." : "วิเคราะห์รูป (หลายรูป)" }}
      </button>
      <button class="btn" :disabled="loading || files.length === 0" @click="clear">
        ล้างรูป
      </button>
    </div>

    <div v-if="files.length" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:10px;">
      <div v-for="(p, idx) in previews" :key="idx" style="border:1px solid #ddd; border-radius:10px; padding:8px;">
        <img :src="p" style="width:100%; height:110px; object-fit:cover; border-radius:8px;" />
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <small style="opacity:.7;">{{ idx + 1 }}/{{ files.length }}</small>
          <button class="btn-danger" :disabled="loading" @click="removeAt(idx)">ลบ</button>
        </div>
      </div>
    </div>

    <p v-if="error" style="color:#c00; margin:0;">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue"
import { useApi } from "~/composables/useApi"

const emit = defineEmits<{
  (e: "batchResult", v: any[]): void
}>()

const { request } = useApi()

const files = ref<File[]>([])
const previews = ref<string[]>([])
const loading = ref(false)
const error = ref("")

function revokeAll() {
  previews.value.forEach((u) => URL.revokeObjectURL(u))
  previews.value = []
}

function clear() {
  files.value = []
  revokeAll()
  error.value = ""
}

function removeAt(i: number) {
  files.value.splice(i, 1)
  URL.revokeObjectURL(previews.value[i])
  previews.value.splice(i, 1)
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  error.value = ""
  clear()

  const picked = Array.from(input.files)

  // จำกัดไม่ให้หนักเกิน (ตรงกับ backend 10)
  files.value = picked.slice(0, 10)
  previews.value = files.value.map((f) => URL.createObjectURL(f))

  // reset ค่า input เพื่อเลือกซ้ำได้
  input.value = ""
}

async function uploadBatch() {
  try {
    error.value = ""
    loading.value = true

    const form = new FormData()
    files.value.forEach((f) => form.append("images", f))

    const res = await request<any[]>("/predict/batch", {
      method: "POST",
      body: form,
    })

    emit("batchResult", res)
  } catch (e: any) {
    error.value = e?.message || "อัปโหลด/วิเคราะห์ไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  revokeAll()
})
</script>

<style scoped>
.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  cursor: pointer;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-danger {
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid #f2b6b6;
  background: #ffecec;
  cursor: pointer;
}
</style>