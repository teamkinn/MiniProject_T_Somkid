const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin"); 
const Usage = require("../models/Usage");

// GET /api/admin/predictions
router.get("/admin/predictions", auth, admin, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  const { user, label } = req.query;
  const filter = {};
  if (user) filter.username = { $regex: String(user), $options: "i" };
  if (label) filter.label = { $regex: String(label), $options: "i" };

  const total = await Usage.countDocuments(filter);
  const items = await Usage.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    items,
  });
});

module.exports = router;
