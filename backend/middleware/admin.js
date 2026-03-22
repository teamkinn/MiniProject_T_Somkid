// backend/middleware/admin.js

module.exports = (req, res, next) => {
  // ต้องมี auth middleware มาก่อน
  // ซึ่งจะ set req.user = { id: ... , role?: ... }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // กรณีคุณมี role เป็น admin
  if (req.user.role && req.user.role === "admin") {
    return next();
  }

  // ถ้ายังไม่ได้ทำระบบ role
  // ให้ใช้ user id เฉพาะ (เช่น admin คนเดียว)
  const ADMIN_IDS = [
    // ใส่ userId ของ admin ที่นี่
    // ตัวอย่าง:
    // "65f123abc456def789012345"
  ];

  if (ADMIN_IDS.includes(req.user.id)) {
    return next();
  }

  return res.status(403).json({ message: "Admin only" });
};
