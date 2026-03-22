const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Usage = require("../models/Usage");
const User = require("../models/User");

function buildSort({ sortBy, sortDir }) {
  const allowed = new Set(["createdAt", "label", "username", "confidence"]);
  const field = allowed.has(String(sortBy)) ? String(sortBy) : "createdAt";
  const dir = String(sortDir).toLowerCase() === "asc" ? 1 : -1;
  return { [field]: dir };
}

function buildFilter({ q, label, from, to, userId, username }) {
  const filter = {};
  if (userId) filter.userId = userId;
  if (username) filter.username = { $regex: String(username), $options: "i" };
  if (label) filter.label = { $regex: String(label), $options: "i" };

  if (q) {
    const regex = { $regex: String(q), $options: "i" };
    filter.$or = [{ label: regex }, { suggestion: regex }, { username: regex }];
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  return filter;
}

// ✅ ให้รูปขึ้นผ่าน /api/uploads
function toImageUrl(imagePath) {
  if (!imagePath) return null;
  if (String(imagePath).startsWith("/uploads/")) return `/api${imagePath}`;
  return imagePath;
}

function withImageUrl(items) {
  return (items || []).map((it) => ({
    ...it,
    imageUrl: toImageUrl(it.imagePath),
  }));
}

// GET /api/history/my
router.get("/history/my", auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  const { q, label, from, to, sortBy, sortDir } = req.query;
  const sort = buildSort({ sortBy, sortDir });

  const filter = buildFilter({ q, label, from, to, userId: req.user.id });

  const total = await Usage.countDocuments(filter);
  const raw = await Usage.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const items = withImageUrl(raw);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    items,
  });
});

// GET /api/history/all (admin)
router.get("/history/all", auth, admin, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  const { q, label, from, to, user, sortBy, sortDir } = req.query;
  const sort = buildSort({ sortBy, sortDir });

  const filter = buildFilter({ q, label, from, to, username: user });

  const total = await Usage.countDocuments(filter);
  const raw = await Usage.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const items = withImageUrl(raw);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    items,
  });
});

// GET /api/history/users (admin)
router.get("/history/users", auth, admin, async (req, res) => {
  const q = String(req.query.q || "").trim();

  const userFilter = {};
  if (q) {
    const regex = { $regex: q, $options: "i" };
    userFilter.$or = [{ username: regex }, { name: regex }, { email: regex }];
  }

  const users = await User.find(userFilter)
    .select("_id username name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const stats = await Usage.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 }, lastUsed: { $max: "$createdAt" } } },
  ]);

  const statMap = new Map(stats.map((s) => [String(s._id), s]));
  const items = users.map((u) => {
    const s = statMap.get(String(u._id));
    return { ...u, usageCount: s?.count || 0, lastUsed: s?.lastUsed || null };
  });

  res.json({ items });
});

// GET /api/history/user/:userId (admin)
router.get("/history/user/:userId", auth, admin, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  const { q, label, from, to, sortBy, sortDir } = req.query;
  const sort = buildSort({ sortBy, sortDir });

  const { userId } = req.params;
  const filter = buildFilter({ q, label, from, to, userId });

  const total = await Usage.countDocuments(filter);
  const raw = await Usage.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const items = withImageUrl(raw);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    items,
  });
});

// DELETE /api/history/:id
router.delete("/history/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Usage.findById(id);
    if (!doc) return res.status(404).json({ message: "History not found" });

    const isAdmin = req.user?.role === "admin";
    const isOwner = String(doc.userId) === String(req.user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (doc.imagePath && String(doc.imagePath).startsWith("/uploads/")) {
      const filename = path.basename(doc.imagePath);
      const abs = path.join(__dirname, "..", "uploads", filename);
      if (fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch (e) {}
      }
    }

    await doc.deleteOne();
    return res.json({ ok: true, deletedId: id });
  } catch (e) {
    return res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;