const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ข้อมูลผู้ใช้
    username: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },

    // เก็บรหัสผ่านแบบ hash เท่านั้น (ปลอดภัยกว่าเก็บ plain text)
    passwordHash: { type: String, required: true, select: false },

    // สำหรับ "ลืมรหัสผ่าน" (รีเซ็ต) แบบง่ายๆ (จำลอง)
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExp: { type: Date, default: null, select: false },

    role: { type: String, enum: ["user", "admin"], default: "user" },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
