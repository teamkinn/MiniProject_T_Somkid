<template>
  <div style="display:grid; gap:14px;">
    <BaseCard>
      <h2 style="margin:0 0 6px;">Live Scan (แสดงประเภทอย่างเดียว)</h2>
      <p class="muted" style="margin:0 0 12px;">
        ระบบจะวิเคราะห์ Top3 แบบสดๆ แต่จะ <b>ไม่บันทึก</b> และ <b>ไม่แนะนำการทิ้ง</b> จนกว่าจะกดแคป
      </p>

      <div v-if="camError" style="color:var(--danger);">
        {{ camError }}
      </div>

      <div v-else class="video-wrap">
        <video ref="videoEl" autoplay playsinline muted class="video"></video>
      </div>

      <div class="row" style="gap:10px; margin-top:12px; flex-wrap:wrap;">
        <BaseButton variant="primary" :disabled="!isCameraReady || loadingCapture" @click="captureAndPredict">
          📸 แคปเพื่อดูคำแนะนำ
        </BaseButton>

        <BaseButton variant="secondary" :disabled="loadingPreview" @click="toggleScan">
          {{ scanning ? '⏸️ หยุดสแกน' : '▶️ เริ่มสแกน' }}
        </BaseButton>

        <span class="muted" style="font-size:12px;">
          สแกนทุก {{ intervalSec }} วินาที
        </span>
      </div>

      <LoadingSpinner v-if="loadingPreview || loadingCapture" />

      <div v-if="topK?.length" style="margin-top:12px;">
        <div style="font-weight:700; margin-bottom:6px;">ผลวิเคราะห์ (สด) Top3</div>
        <ol style="margin:0; padding-left:18px;">
          <li v-for="(t, idx) in topK" :key="idx">
            <b>{{ labelThai(t.label) }}</b> — {{ percent(t.confidence) }}
          </li>
        </ol>
      </div>

      <p v-if="previewError" style="color:var(--danger); margin-top:10px;">
        {{ previewError }}
      </p>
    </BaseCard>

    <!-- แคปแล้วค่อยให้ยืนยัน/แก้ประเภท -->
    <PredictionFeedbackModal
      :open="isModalOpen"
      :result="captureResult"
      @close="isModalOpen = false"
      @confirmed="onConfirmed"
    />

    <!-- (เหมือนหน้าแรก) แสดงคำแนะนำหลังยืนยันแล้วเท่านั้น -->
    <ResultPanel v-if="isConfirmed" :result="captureResult" />
  </div>

  <!-- canvas ซ่อน ใช้แคปเฟรม -->
  <canvas ref="canvasEl" width="640" height="480" style="display:none;"></canvas>
</template>

<script setup lang="ts">
import PredictionFeedbackModal from "@/components/PredictionFeedbackModal.vue";
import ResultPanel from "@/components/ResultPanel.vue";

const { request } = useApi();

const videoEl = ref<HTMLVideoElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const camError = ref("");
const previewError = ref("");

const scanning = ref(true);
const intervalSec = 5;

const isCameraReady = ref(false);
let stream: MediaStream | null = null;
let timer: any = null;

const topK = ref<Array<{ label: string; confidence: number }> | null>(null);
const loadingPreview = ref(false);

const isModalOpen = ref(false);
const captureResult = ref<any>(null);
const isConfirmed = ref(false);
const loadingCapture = ref(false);

function percent(v: any) {
  if (typeof v !== "number") return "";
  return Math.round(v * 100) + "%";
}

function labelThai(label: any) {
  const map: Record<string, string> = {
    general: "ขยะทั่วไป",
    recycle: "ขยะรีไซเคิล",
    organic: "ขยะเปียก",
    hazardous: "ขยะอันตราย",
  };
  return map[label] || label || "Unknown";
}

async function initCamera() {
  camError.value = "";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    if (videoEl.value) {
      videoEl.value.srcObject = stream;
      await videoEl.value.play();
      isCameraReady.value = true;
    }

    startTimer();
  } catch (e: any) {
    camError.value = e?.message || "ไม่สามารถเปิดกล้องได้";
    isCameraReady.value = false;
  }
}

function startTimer() {
  stopTimer();
  if (!scanning.value) return;

  timer = setInterval(() => {
    if (!loadingPreview.value) previewOnce();
  }, intervalSec * 1000);

  // ยิงทันที 1 ครั้ง
  previewOnce();
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function toggleScan() {
  scanning.value = !scanning.value;
  if (scanning.value) startTimer();
  else stopTimer();
}

function drawFrameToCanvas(): boolean {
  const v = videoEl.value;
  const c = canvasEl.value;
  if (!v || !c) return false;

  const ctx = c.getContext("2d");
  if (!ctx) return false;

  // ปรับ canvas ให้ตรงกับวิดีโอจริง จะคมกว่า
  const w = v.videoWidth || 640;
  const h = v.videoHeight || 480;
  c.width = w;
  c.height = h;

  ctx.drawImage(v, 0, 0, w, h);
  return true;
}

function canvasToFile(): Promise<File> {
  const c = canvasEl.value!;
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (!blob) return reject(new Error("แคปรูปไม่สำเร็จ"));
      resolve(new File([blob], "frame.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  });
}

async function previewOnce() {
  previewError.value = "";
  if (!isCameraReady.value) return;
  if (!drawFrameToCanvas()) return;

  loadingPreview.value = true;
  try {
    const file = await canvasToFile();
    const form = new FormData();
    form.append("image", file);

    // ✅ สำคัญ: live scan ใช้ preview เท่านั้น (ไม่บันทึก + ไม่แนะนำ)
    const data = await request<{ topK: Array<{ label: string; confidence: number }> }>("/predict/preview", {
      method: "POST",
      body: form,
    });

    topK.value = data?.topK || null;
  } catch (e: any) {
    previewError.value = e?.message || "preview ไม่สำเร็จ";
  } finally {
    loadingPreview.value = false;
  }
}

async function captureAndPredict() {
  previewError.value = "";
  isConfirmed.value = false;

  if (!isCameraReady.value) return;
  if (!drawFrameToCanvas()) return;

  loadingCapture.value = true;
  try {
    const file = await canvasToFile();
    const form = new FormData();
    form.append("image", file);

    // ✅ สำคัญ: กดแคปแล้วค่อยเรียก /predict (บันทึก + แนะนำ)
    const data = await request<any>("/predict", {
      method: "POST",
      body: form,
    });

    captureResult.value = data;
    isModalOpen.value = true;
  } catch (e: any) {
    previewError.value = e?.message || "แคปแล้ววิเคราะห์ไม่สำเร็จ";
  } finally {
    loadingCapture.value = false;
  }
}

// frontend/pages/live-scan.vue

const suggestionMap: Record<string, string> = {
  general: "แยกทิ้งถังขยะทั่วไป",
  recycle: "ล้างให้สะอาด/เทน้ำออก แล้วทิ้งถังรีไซเคิล",
  organic: "ทิ้งถังขยะเปียก/ย่อยสลายได้",
  hazardous: "ทิ้งถังขยะอันตราย หรือจุดรับของเสียอันตราย",
}

function onConfirmed(payload: { isCorrect: boolean; correctedLabel?: string }) {
  isConfirmed.value = true

  if (payload?.isCorrect === false && payload.correctedLabel && captureResult.value?.predicted) {
    captureResult.value.predicted.label = payload.correctedLabel
    captureResult.value.predicted.confidence = 1

    // ✅ เพิ่มบรรทัดนี้
    captureResult.value.suggestion = suggestionMap[payload.correctedLabel] || captureResult.value.suggestion
  }
}


onMounted(() => {
  initCamera();
});

onBeforeUnmount(() => {
  stopTimer();
  if (stream) {
    for (const t of stream.getTracks()) t.stop();
    stream = null;
  }
});
</script>

<style scoped>
.video-wrap {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
}
.video {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}
</style>
