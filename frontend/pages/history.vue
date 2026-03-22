<script setup lang="ts">
import { ref, onMounted } from "vue"

const { request } = useApi()
const { isAdmin } = useAuth()

const q = ref("")
const label = ref("")
const from = ref("")
const to = ref("")

const page = ref(1)
const totalPages = ref(1)

const items = ref<any[]>([])
const loading = ref(false)
const error = ref("")
const deletingId = ref<string | null>(null)

const users = ref<any[]>([])
const usersLoading = ref(false)
const usersError = ref("")
const userQ = ref("")

const historyOpen = ref(false)
const historyTitle = ref("")
const selectedUser = ref<any>(null)
const mode = ref<"mine" | "all" | "user">("mine")

const sortBy = ref<"createdAt" | "label" | "username" | "confidence">("createdAt")
const sortDir = ref<"desc" | "asc">("desc")

// ✅ helper ทำ URL รูปให้เปิดได้จริง
function imgUrl(it: any) {
  const p = it?.imageUrl || it?.imagePath || null
  if (!p) return null

  // ถ้าเป็น /uploads/xxx.jpg → ให้เรียกผ่าน proxy /api
  if (typeof p === "string" && p.startsWith("/uploads/")) {
    return "/api" + p  // => /api/uploads/xxx.jpg
  }

  return p
}
function qs(params: Record<string, any>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    const s = String(v).trim()
    if (!s) continue
    q.set(k, s)
  }
  const str = q.toString()
  return str ? `?${str}` : ""
}

// ✅ helper: ได้ url รูป (มาจาก backend แล้ว หรือ fallback)

/* ----------------- ADMIN: load users ----------------- */
async function loadUsers() {
  if (!isAdmin.value) return
  usersLoading.value = true
  usersError.value = ""
  try {
    const res = await request<any>(`/history/users${qs({ q: userQ.value })}`)
    users.value = res?.items || res?.users || []
  } catch (e: any) {
    usersError.value = e?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ"
  } finally {
    usersLoading.value = false
  }
}

/* ----------------- LOAD: mine ----------------- */
async function reloadMine() {
  mode.value = "mine"
  selectedUser.value = null
  historyTitle.value = "ประวัติของฉัน"

  loading.value = true
  error.value = ""
  try {
    const url =
      `/history/my` +
      qs({
        page: page.value,
        limit: 20,
        q: q.value,
        label: label.value,
        from: from.value,
        to: to.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })

    const res = await request<any>(url)

    if (Array.isArray(res)) {
      items.value = res
      totalPages.value = 1
      page.value = 1
    } else {
      items.value = res?.items || []
      page.value = res?.page || page.value || 1
      totalPages.value = res?.totalPages || 1
    }
  } catch (e: any) {
    error.value = e?.message || "โหลดประวัติไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

/* ----------------- ADMIN: all/users ----------------- */
async function reloadAll() {
  if (!isAdmin.value) return

  mode.value = "all"
  historyOpen.value = true
  selectedUser.value = null
  historyTitle.value = "ประวัติทั้งหมดของทุกคน"

  loading.value = true
  error.value = ""
  try {
    const url =
      `/history/all` +
      qs({
        page: page.value,
        limit: 20,
        q: q.value,
        label: label.value,
        from: from.value,
        to: to.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })

    const res = await request<any>(url)

    if (Array.isArray(res)) {
      items.value = res
      totalPages.value = 1
      page.value = 1
    } else {
      items.value = res?.items || []
      page.value = res?.page || page.value || 1
      totalPages.value = res?.totalPages || 1
    }
  } catch (e: any) {
    error.value = e?.message || "โหลดประวัติไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

async function reloadUser() {
  if (!isAdmin.value) return
  if (!selectedUser.value?._id) return

  mode.value = "user"
  historyOpen.value = true
  historyTitle.value = `ประวัติของ: ${selectedUser.value.username} (${selectedUser.value.name || "-"})`

  loading.value = true
  error.value = ""
  try {
    const url =
      `/history/user/${selectedUser.value._id}` +
      qs({
        page: page.value,
        limit: 20,
        q: q.value,
        label: label.value,
        from: from.value,
        to: to.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })

    const res = await request<any>(url)

    if (Array.isArray(res)) {
      items.value = res
      totalPages.value = 1
      page.value = 1
    } else {
      items.value = res?.items || []
      page.value = res?.page || page.value || 1
      totalPages.value = res?.totalPages || 1
    }
  } catch (e: any) {
    error.value = e?.message || "โหลดประวัติไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

function openUserHistory(u: any) {
  if (!isAdmin.value) return
  selectedUser.value = u
  page.value = 1
  reloadUser()
}

function closeHistory() {
  historyOpen.value = false
  items.value = []
  error.value = ""
}

function resetFilters() {
  q.value = ""
  label.value = ""
  from.value = ""
  to.value = ""
  page.value = 1
}

async function doSearch() {
  page.value = 1
  if (!isAdmin.value) return reloadMine()

  if (mode.value === "user") return reloadUser()
  return reloadAll()
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    if (!isAdmin.value) reloadMine()
    else if (mode.value === "user") reloadUser()
    else reloadAll()
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    if (!isAdmin.value) reloadMine()
    else if (mode.value === "user") reloadUser()
    else reloadAll()
  }
}

async function deleteHistory(it: any) {
  if (!it?._id) return
  const ok = confirm("ลบประวัตินี้เลยไหม?")
  if (!ok) return

  deletingId.value = it._id
  try {
    await request<any>(`/history/${it._id}`, { method: "DELETE" })

    if (items.value.length <= 1 && page.value > 1) page.value--

    if (!isAdmin.value) await reloadMine()
    else if (mode.value === "user") await reloadUser()
    else await reloadAll()
  } catch (e: any) {
    alert(e?.message || "ลบไม่สำเร็จ")
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  if (isAdmin.value) {
    await loadUsers()
  } else {
    await reloadMine()
  }
})
</script>

<template>
  <div class="p-6">
    <template v-if="isAdmin">
      <div class="flex gap-2 mb-4">
        <button class="btn" @click="reloadAll">ดูประวัติทั้งหมด</button>
        <button class="btn" @click="loadUsers">ดูรายชื่อผู้ใช้</button>
      </div>

      <div class="card mb-4">
        <div class="flex gap-2 items-center">
          <input v-model="userQ" class="input" placeholder="ค้นหา user (username/name/email)" />
          <button class="btn" @click="loadUsers">ค้นหา user</button>
        </div>

        <div v-if="usersLoading" class="muted mt-2">กำลังโหลดรายชื่อ...</div>
        <div v-if="usersError" class="error mt-2">{{ usersError }}</div>

        <div v-if="users.length" class="mt-3">
          <div v-for="u in users" :key="u._id" class="user-row" @click="openUserHistory(u)">
            <div class="left">
              <div class="name">{{ u.username }} — {{ u.name }}</div>
              <div class="muted">{{ u.email }}</div>
            </div>
            <div class="right">
              <div>ประวัติ: {{ u.usageCount || 0 }}</div>
              <div class="muted" v-if="u.lastUsed">ล่าสุด: {{ new Date(u.lastUsed).toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL -->
      <div v-if="historyOpen" class="modal-backdrop" @click.self="closeHistory">
        <div class="modal">
          <div class="flex justify-between items-center mb-2">
            <div class="title">{{ historyTitle }}</div>
            <button class="btn ghost" @click="closeHistory">ปิด</button>
          </div>

          <div class="grid gap-2 mb-3">
            <input v-model="q" class="input" placeholder="ค้นหา (label/คำแนะนำ/username)" />
            <select v-model="label" class="input">
              <option value="">ทุกประเภท</option>
              <option value="general">general</option>
              <option value="recycle">recycle</option>
              <option value="organic">organic</option>
              <option value="hazardous">hazardous</option>
            </select>

            <div class="flex gap-2">
              <select v-model="sortBy" class="input">
                <option value="createdAt">เรียงตามเวลา</option>
                <option value="label">เรียงตามประเภท</option>
                <option value="username">เรียงตาม username</option>
                <option value="confidence">เรียงตามความมั่นใจ</option>
              </select>

              <select v-model="sortDir" class="input">
                <option value="desc">มาก→น้อย / ล่าสุดก่อน</option>
                <option value="asc">น้อย→มาก / เก่าก่อน</option>
              </select>

              <button class="btn" @click="doSearch">ค้นหา</button>
              <button class="btn ghost" @click="resetFilters">ล้าง</button>
            </div>
          </div>

          <div v-if="loading" class="muted">กำลังโหลด...</div>
          <div v-if="error" class="error">{{ error }}</div>

          <div v-if="!loading && !error">
            <div v-if="!items.length" class="muted">ไม่มีข้อมูล</div>

            <div v-else class="list">
              <div v-for="it in items" :key="it._id" class="item">
                <div class="row">
                  <!-- ✅ รูป -->
                  <img
                    v-if="imgUrl(it)"
                    :src="imgUrl(it)"
                    class="thumb"
                  />

                  <div class="label">
                    <div>
                      ทำนาย: <b>{{ it.label }}</b>
                      <span v-if="it.isCorrect === true" class="ok"> (ถูก)</span>
                      <span v-else-if="it.isCorrect === false" class="no"> (ไม่ถูก)</span>
                    </div>
                    <div v-if="it.isCorrect === false && it.correctedLabel" class="muted">
                      ที่ถูก: <span class="correct">{{ it.correctedLabel }}</span>
                    </div>
                    <div class="muted">{{ it.suggestion }}</div>
                  </div>

                  <div class="actions">
                    <div class="muted">{{ new Date(it.createdAt).toLocaleString() }}</div>
                    <button class="btn danger" :disabled="deletingId===it._id" @click.stop="deleteHistory(it)">
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 items-center mt-3">
              <button class="btn ghost" @click="prevPage" :disabled="page <= 1">ก่อนหน้า</button>
              <div class="muted">หน้า {{ page }} / {{ totalPages }}</div>
              <button class="btn ghost" @click="nextPage" :disabled="page >= totalPages">ถัดไป</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- USER VIEW -->
    <template v-else>
      <div class="card mb-4">
        <div class="title mb-2">ประวัติของฉัน</div>

        <div class="grid gap-2 mb-3">
          <input v-model="q" class="input" placeholder="ค้นหา (label/คำแนะนำ)" />
          <select v-model="label" class="input">
            <option value="">ทุกประเภท</option>
            <option value="general">general</option>
            <option value="recycle">recycle</option>
            <option value="organic">organic</option>
            <option value="hazardous">hazardous</option>
          </select>
          <div class="flex gap-2">
            <input v-model="from" class="input" placeholder="from (YYYY-MM-DD)" />
            <input v-model="to" class="input" placeholder="to (YYYY-MM-DD)" />
          </div>

          <div class="flex gap-2">
            <button class="btn" @click="doSearch">ค้นหา</button>
            <button class="btn ghost" @click="resetFilters">ล้าง</button>
          </div>
        </div>

        <div v-if="loading" class="muted">กำลังโหลด...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="!loading && !error">
          <div v-if="!items.length" class="muted">ไม่มีข้อมูล</div>

          <div v-else class="list">
            <div v-for="it in items" :key="it._id" class="item">
              <div class="row">
                <!-- ✅ รูป -->
                <img v-if="imgUrl(it)" :src="imgUrl(it)" class="thumb" />

                <div class="label">
                  <div>
                    ทำนาย: <b>{{ it.label }}</b>
                    <span v-if="it.isCorrect === true" class="ok"> (ถูก)</span>
                    <span v-else-if="it.isCorrect === false" class="no"> (ไม่ถูก)</span>
                  </div>
                  <div v-if="it.isCorrect === false && it.correctedLabel" class="muted">
                    ที่ถูก: <span class="correct">{{ it.correctedLabel }}</span>
                  </div>
                  <div class="muted">{{ it.suggestion }}</div>
                </div>

                <div class="actions">
                  <div class="muted">{{ new Date(it.createdAt).toLocaleString() }}</div>
                  <button class="btn danger" :disabled="deletingId===it._id" @click.stop="deleteHistory(it)">
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 items-center mt-3">
            <button class="btn ghost" @click="prevPage" :disabled="page <= 1">ก่อนหน้า</button>
            <div class="muted">หน้า {{ page }} / {{ totalPages }}</div>
            <button class="btn ghost" @click="nextPage" :disabled="page >= totalPages">ถัดไป</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.btn { padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color:#fff; }
.btn.ghost { background: transparent; }
.input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.15); color: #fff; }
.input::placeholder { color: rgba(255,255,255,.7); }

.card { padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04); }
.user-row { display:flex; justify-content:space-between; padding:10px; border-radius:12px; border:1px solid rgba(255,255,255,.08); margin-top:8px; cursor:pointer; }
.user-row:hover { background: rgba(255,255,255,.04); }
.name { font-weight:600; }
.muted { opacity:.75; font-size: 13px; }
.error { color: #ff6b6b; white-space: pre-wrap; }
.ok { color: #55efc4; }
.no { color: #ff7675; }
.correct { font-weight: 700; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display:flex; justify-content:center; align-items:center; padding: 16px; z-index: 9999; }
.modal { width: min(900px, 100%); max-height: 85vh; overflow:auto; padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,.12); background: #0e1525; color:#fff; }
.title { font-weight:700; }
.list { display:flex; flex-direction:column; gap: 10px; }
.item { padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); }
.row { display:flex; justify-content:space-between; gap: 12px; align-items:center; }
.actions { display:flex; align-items:center; gap:10px; }
.btn.danger { border-color: rgba(255, 107, 107, .45); color:#ff6b6b; }
.label { font-weight:700; }

/* ✅ thumbnail */
.thumb{
  width:64px;
  height:64px;
  object-fit:cover;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.12);
  flex: 0 0 auto;
}
</style>