const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth"); // ต้องมี req.user.id จาก JWT

// GET /api/me -> เอาข้อมูลโปรไฟล์
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("_id username name email createdAt role");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// PUT /api/me -> แก้ข้อมูลส่วนตัว (username/name/email)
router.put("/me", auth, async (req, res) => {
  const { username, name, email } = req.body || {};

  const update = {};

  if (username !== undefined) {
    if (!username || typeof username !== "string")
      return res.status(400).json({ message: "Invalid username" });
    const newUsername = username.trim();
    if (newUsername.length < 3 || newUsername.length > 24)
      return res.status(400).json({ message: "Username must be 3-24 chars" });
    const exists = await User.findOne({ username: newUsername, _id: { $ne: req.user.id } });
    if (exists) return res.status(409).json({ message: "Username already taken" });
    update.username = newUsername;
  }

  if (name !== undefined) {
    if (!name || typeof name !== "string")
      return res.status(400).json({ message: "Invalid name" });
    const newName = name.trim();
    if (newName.length < 1 || newName.length > 60)
      return res.status(400).json({ message: "Name must be 1-60 chars" });
    update.name = newName;
  }

  if (email !== undefined) {
    if (!email || typeof email !== "string")
      return res.status(400).json({ message: "Invalid email" });
    const newEmail = email.trim().toLowerCase();
    if (!newEmail.includes("@"))
      return res.status(400).json({ message: "Invalid email" });
    const exists = await User.findOne({ email: newEmail, _id: { $ne: req.user.id } });
    if (exists) return res.status(409).json({ message: "Email already taken" });
    update.email = newEmail;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    update,
    { new: true }
  ).select("_id username name email createdAt role");

  res.json(updated);
});

// PUT /api/me/password -> เปลี่ยนรหัสผ่าน
router.put("/me/password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Missing password fields" });

  if (typeof newPassword !== "string" || newPassword.length < 8)
    return res.status(400).json({ message: "New password must be at least 8 chars" });

  const user = await User.findById(req.user.id).select("+passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

  const saltRounds = 10;
  user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  await user.save();

  res.json({ message: "Password updated" });
});

module.exports = router;
