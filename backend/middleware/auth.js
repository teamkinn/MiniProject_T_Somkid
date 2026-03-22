// middleware/auth.js (ย่อ)
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const u = await User.findById(userId).select("role");
    if (!u) return res.status(401).json({ message: "User not found" });

    req.user = { id: userId, role: u.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
