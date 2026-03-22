<template>
  <div class="container">
    <h1>How to Use</h1>
    <p class="subtitle">
      วิธีการใช้งานระบบทำนายผลจากรูปภาพ
    </p>

    <ol class="steps">
      <li>
        <h3>สมัครสมาชิกและเข้าสู่ระบบ</h3>
        <p>
          สมัครสมาชิกผ่านหน้า Register และเข้าสู่ระบบผ่านหน้า Login
        </p>
      </li>

      <li>
        <h3>เข้าหน้าอัปโหลดรูปภาพ</h3>
        <p>
          หลังเข้าสู่ระบบ ระบบจะพาไปยังหน้าหลักสำหรับอัปโหลดรูปภาพ
        </p>
      </li>

      <li>
        <h3>อัปโหลดรูปและกด Predict</h3>
        <p>
          เลือกรูปภาพจากอุปกรณ์ และกดปุ่ม Predict เพื่อเริ่มการทำนาย
        </p>
      </li>

      <li>
        <h3>ดูผลการทำนาย</h3>
        <p>
          ระบบจะแสดง Label, Confidence และคำแนะนำจากโมเดล
        </p>
      </li>
    </ol>

    <NuxtLink to="/" class="btn">
      เริ่มใช้งานระบบ
    </NuxtLink>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}
.subtitle {
  color: #666;
  margin-bottom: 24px;
}
.steps li {
  margin-bottom: 20px;
}
.btn {
  display: inline-block;
  margin-top: 30px;
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  text-decoration: none;
}
</style>
