const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body || {};
    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: "name/username/email/password required" });
    }

    const usernameNorm = String(username).trim();
    const nameNorm = String(name).trim();
    const emailNorm = String(email).trim().toLowerCase();

    if (usernameNorm.length < 3) return res.status(400).json({ message: "username too short" });
    if (!emailNorm.includes("@")) return res.status(400).json({ message: "invalid email" });
    if (String(password).length < 4) return res.status(400).json({ message: "password too short" });

    const exists = await User.findOne({ $or: [{ username: usernameNorm }, { email: emailNorm }] });
    if (exists) return res.status(409).json({ message: "username or email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: usernameNorm,
      name: nameNorm,
      email: emailNorm,
      passwordHash,
    });

    return res.json({ message: "registered", userId: user._id });
  } catch (err) {
    return res.status(500).json({ message: err.message || "server error" });
  }
};

exports.login = async (req, res) => {
  try {
    // รองรับ login ด้วย username หรือ email
    const { identifier, username, email, password } = req.body || {};
    const id = (identifier || email || username || "").toString().trim();
    if (!id || !password) {
      return res.status(400).json({ message: "username/email and password required" });
    }

    const query = id.includes("@")
      ? { email: id.toLowerCase() }
      : { username: id };

    // ✅ ดึง passwordHash ให้ชัวร์ (กันกรณี schema เคยตั้ง select:false)
    const user = await User.findOne(query).select("+passwordHash username role name email");
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    // ✅ กันค่าหาย (กัน error Illegal arguments)
    if (!user.passwordHash) {
      return res.status(500).json({
        message: "passwordHash missing for this user (check User model / select:false / existing data)",
      });
    }

    const ok = await bcrypt.compare(String(password), String(user.passwordHash));
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "server error" });
  }
};

// POST /api/auth/forgot-password
// หมายเหตุ: เราไม่สามารถ "ส่งรหัสผ่านเดิม" ได้ เพราะเก็บเป็น hash
// ทางที่ถูกคือให้ user ตั้งรหัสผ่านใหม่ผ่าน token (จำลอง: คืน token ใน response)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const emailNorm = String(email || "").trim().toLowerCase();
    if (!emailNorm) return res.status(400).json({ message: "email required" });

    const user = await User.findOne({ email: emailNorm }).select("_id");
    // ไม่บอกว่า email มี/ไม่มี เพื่อความปลอดภัย
    if (!user) {
      return res.json({
        message: "ถ้าอีเมลนี้มีอยู่ในระบบ เราจะส่งวิธีรีเซ็ตรหัสผ่านให้ (จำลอง)",
      });
    }

    const resetToken = crypto.randomBytes(24).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

    await User.findByIdAndUpdate(user._id, { resetTokenHash, resetTokenExp });

    return res.json({
      message: "ส่งโทเคนรีเซ็ตรหัสผ่านแล้ว (จำลอง — ไม่มีการส่งอีเมลจริง)",
      resetToken, // สำหรับงาน/เดโม
      expiresAt: resetTokenExp,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "server error" });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body || {};
    const emailNorm = String(email || "").trim().toLowerCase();
    if (!emailNorm || !resetToken || !newPassword) {
      return res.status(400).json({ message: "email/resetToken/newPassword required" });
    }
    if (String(newPassword).length < 4) {
      return res.status(400).json({ message: "newPassword too short" });
    }

    const user = await User.findOne({ email: emailNorm }).select(
      "+resetTokenHash +resetTokenExp"
    );
    if (!user || !user.resetTokenHash || !user.resetTokenExp) {
      return res.status(400).json({ message: "invalid reset request" });
    }
    if (user.resetTokenExp.getTime() < Date.now()) {
      return res.status(400).json({ message: "reset token expired" });
    }
    const ok = await bcrypt.compare(String(resetToken), String(user.resetTokenHash));
    if (!ok) return res.status(400).json({ message: "invalid reset token" });

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.passwordHash = passwordHash;
    user.resetTokenHash = null;
    user.resetTokenExp = null;
    await user.save();

    return res.json({ message: "password reset success" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "server error" });
  }
};

