<template>
  <BaseCard>
    <h3 style="margin:0 0 10px;">ผลการวิเคราะห์</h3>

    <div class="row" style="align-items:flex-start;">
      <div style="flex:1; min-width:220px;">
        <div style="margin-bottom:6px;">
          <b>ประเภท:</b> {{ labelTh(result.predicted?.label) }}
        </div>

        <div style="margin-bottom:6px;">
          <b>ความมั่นใจ:</b> {{ confidencePercent }}%
        </div>

        <div v-if="result.suggestion">
          <b>คำแนะนำ:</b> {{ result.suggestion }}
        </div>
      </div>

      <div style="min-width:240px;">
        <div class="muted" style="font-size:12px; margin-bottom:6px;">
          label ที่ระบบรองรับ (ตัวอย่าง)
        </div>
        <div class="muted" style="font-size:12px; line-height:1.6;">
          general / recycle / organic / hazardous
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
type ClassifyResult = {
  predictionId?: string
  imageUrl?: string
  predicted: {
    label: string
    confidence: number
    title?: string
    desc?: string
  }
  suggestion?: string
}

const props = defineProps<{ result: ClassifyResult }>()
const result = props.result

const th: Record<string, string> = {
  general: "ขยะทั่วไป",
  recycle: "ขยะรีไซเคิล",
  organic: "ขยะเปียก",
  hazardous: "ขยะอันตราย",
}

function labelTh(l?: string) {
  if (!l) return "Unknown"
  return th[l] || l
}

const confidencePercent = computed(() => {
  const c = result?.predicted?.confidence
  // กัน null/undefined/NaN
  if (typeof c !== "number" || Number.isNaN(c)) return 0
  return Math.round(c * 100)
})
</script>
