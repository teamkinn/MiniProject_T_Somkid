<template>
  <div>
    <ImageUploader
      @predicted="onPredicted"
      @batchResult="onBatchResult"
      @reset="onReset"
    />

    <!-- ผลแนะนำหลายรูป (ต้อง confirm ก่อนถึงโชว์) -->
    <div v-if="results.length" style="display:grid; gap:14px; margin-top:12px;">
      <div v-for="(r, i) in results" :key="r?.predictionId || i" style="display:grid; gap:8px;">
        <div style="opacity:.8; font-size:14px;">ผลรูปที่ {{ i + 1 }} / {{ results.length }}</div>
        <ResultPanel v-if="confirmed.has(i)" :result="r" />
      </div>
    </div>

    <PredictionFeedbackModal
      :open="isModalOpen"
      :result="currentResult"
      :index="currentIndexSafe"
      :total="results.length || 1"
      @close="closeModal"
      @confirmed="onConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import ResultPanel from "@/components/ResultPanel.vue";
import PredictionFeedbackModal from "@/components/PredictionFeedbackModal.vue";

const results = ref<any[]>([]);
const confirmed = ref<Set<number>>(new Set());
const currentIndex = ref<number>(-1);
const isModalOpen = ref(false);

const currentIndexSafe = computed(() => (currentIndex.value < 0 ? 0 : currentIndex.value));

const currentResult = computed(() => {
  if (currentIndex.value < 0) return null;
  return results.value[currentIndex.value] || null;
});

const suggestionMap: Record<string, string> = {
  general: "แยกทิ้งถังขยะทั่วไป",
  recycle: "ล้างให้สะอาด/เทน้ำออก แล้วทิ้งถังรีไซเคิล",
  organic: "ทิ้งถังขยะเปียก/ย่อยสลายได้",
  hazardous: "ทิ้งถังขยะอันตราย หรือจุดรับของเสียอันตราย",
};

function onReset() {
  results.value = [];
  confirmed.value = new Set();
  currentIndex.value = -1;
  isModalOpen.value = false;
}

function onPredicted(res: any) {
  results.value = [res];
  confirmed.value = new Set();
  currentIndex.value = 0;
  isModalOpen.value = true;
}

function onBatchResult(resList: any[]) {
  results.value = Array.isArray(resList) ? resList : [];
  confirmed.value = new Set();
  currentIndex.value = results.value.length ? 0 : -1;
  isModalOpen.value = results.value.length > 0;
}

function closeModal() {
  // ปิดเฉย ๆ (ถ้าปิดกลางทาง รูปต่อไปจะไม่เด้ง)
  isModalOpen.value = false;
  currentIndex.value = -1;
}

function onConfirmed(payload: { isCorrect: boolean; correctedLabel?: string }) {
  const idx = currentIndex.value;
  if (idx < 0) return;

  // ถ้าแก้ label → อัปเดตผลเฉพาะรูปนี้
  if (payload?.isCorrect === false && payload.correctedLabel) {
    const r = results.value[idx];
    if (r?.predicted) {
      r.predicted.label = payload.correctedLabel;
      r.predicted.confidence = 1;
    }
    r.suggestion = suggestionMap[payload.correctedLabel] || r.suggestion;
  }

  // ✅ mark confirm → ResultPanel ของรูปนี้จะโชว์
  confirmed.value.add(idx);

  // ✅ ไปภาพถัดไปอัตโนมัติ
  const next = idx + 1;
  if (next < results.value.length) {
    currentIndex.value = next;
    isModalOpen.value = true;
  } else {
    isModalOpen.value = false;
    currentIndex.value = -1;
  }
}
</script>