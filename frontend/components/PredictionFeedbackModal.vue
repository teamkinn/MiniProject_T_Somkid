<template>
  <div v-if="open" class="overlay">
    <div class="modal">
      <h2 style="margin:0 0 6px;">ผลการสแกน</h2>

      <div style="opacity:.8; margin-bottom:10px;">
        รูปที่ {{ index + 1 }} / {{ total }}
      </div>

      <!-- โชว์รูป -->
      <img
      v-if="result?.imageUrl || result?.imagePath || result?.image_path"
      :src="result.imageUrl || result.imagePath || result.image_path"
      style="width:120px; height:120px; object-fit:cover; border-radius:12px; margin-bottom:10px;"
      />    

      <div class="card">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:700;">
              ฉันทายว่า {{ labelText(result?.predicted?.label) }}
            </div>
            <div style="opacity:.85; font-size:14px;">
              {{ result?.predicted?.desc || "" }}
            </div>
          </div>
          <div style="font-weight:700;">
            {{ Math.round((result?.predicted?.confidence || 0) * 100) }}%
          </div>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn ok" @click="confirmCorrect">ถูก</button>
        <button class="btn no" @click="showPick = true">ไม่ถูก</button>
      </div>

      <div v-if="showPick" style="margin-top:14px;">
        <div style="opacity:.85; margin-bottom:8px;">เลือกประเภทที่ถูก:</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="chip" @click="pick('general')">ทั่วไป</button>
          <button class="chip" @click="pick('recycle')">รีไซเคิล</button>
          <button class="chip" @click="pick('organic')">เปียก/ย่อยสลาย</button>
          <button class="chip" @click="pick('hazardous')">อันตราย</button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:14px;">
        <button class="btn ghost" @click="$emit('close')">ปิด</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  open: boolean;
  result: any;
  index: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirmed", payload: { isCorrect: boolean; correctedLabel?: string }): void;
}>();

const showPick = ref(false);

function labelText(label: string) {
  if (label === "general") return "ขยะทั่วไป";
  if (label === "recycle") return "ขยะรีไซเคิล";
  if (label === "organic") return "ขยะเปียก/ย่อยสลาย";
  if (label === "hazardous") return "ขยะอันตราย";
  return label || "ไม่ทราบ";
}

function confirmCorrect() {
  showPick.value = false;
  emit("confirmed", { isCorrect: true });
}

function pick(label: string) {
  showPick.value = false;
  emit("confirmed", { isCorrect: false, correctedLabel: label });
}
</script>

<style scoped>
.overlay{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; padding:16px; }
.modal{ width:min(760px, 96vw); border-radius:18px; padding:18px; background:#141414; color:#fff; box-shadow:0 10px 40px rgba(0,0,0,.35); }
.card{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:12px; }
.btn{ padding:10px 14px; border-radius:12px; border:0; cursor:pointer; }
.ok{ background:#1f7a46; color:#fff; }
.no{ background:#7a1f1f; color:#fff; }
.ghost{ background:transparent; border:1px solid rgba(255,255,255,.18); color:#fff; }
.chip{ padding:8px 12px; border-radius:999px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff; cursor:pointer; }
</style>