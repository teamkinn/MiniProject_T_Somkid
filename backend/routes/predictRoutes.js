// backend/routes/predictRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const predictController = require("../controllers/predictController");
const auth = require("../middleware/auth");
const Usage = require("../models/Usage");
const User = require("../models/User");

const LABEL_MAP = {
  biological: "organic",
  food: "organic",
  paper: "recycle",
  plastic: "recycle",
  glass: "recycle",
  metal: "recycle",
};

const CLASS_META = {
  general: {
    title: "ขยะทั่วไป",
    desc: "ขยะที่ไม่สามารถรีไซเคิลหรือย่อยสลายได้ เช่น ซองขนมเปื้อนอาหาร กล่องโฟม กระดาษทิชชูใช้แล้ว ควรทิ้งลงถังขยะทั่วไปให้มิดชิด ถังสีเหลือง",
  },
  recycle: {
    title: "ขยะรีไซเคิล",
    desc: "วัสดุที่สามารถนำกลับมาใช้ใหม่ได้ เช่น ขวดพลาสติก กระป๋องอลูมิเนียม ขวดแก้ว และกระดาษสะอาด ควรล้างให้สะอาดและแยกก่อนทิ้งลงถังรีไซเคิล ถังสีน้ำเงิน",
  },
  organic: {
    title: "ขยะเปียก / ขยะอินทรีย์",
    desc: "ขยะที่ย่อยสลายได้ตามธรรมชาติ เช่น เศษอาหาร เปลือกผักผลไม้ กากกาแฟ และใบไม้ สามารถนำไปทำปุ๋ยหมักหรือนำไปกำจัดอย่างถูกวิธี ถังสีเขียว",
  },
  hazardous: {
    title: "ขยะอันตราย",
    desc: "ขยะที่มีสารเคมีหรือวัสดุอันตราย เช่น แบตเตอรี่ ถ่านไฟฉาย หลอดไฟ และภาชนะบรรจุสารเคมี ควรแยกทิ้งในจุดรับขยะอันตรายโดยเฉพาะ ถังสีแดง",
  },
};

// ✅ ทำให้รูปขึ้นแน่นอนผ่าน proxy /api
function toPublicUrl(imagePath) {
  // imagePath เก็บเป็น "/uploads/xxx.jpg"
  // เราเสิร์ฟรูปผ่าน "/api/uploads/xxx.jpg"
  if (!imagePath) return null;
  if (imagePath.startsWith("/uploads/")) return `/api${imagePath}`;
  return imagePath;
}

// ---------- Multer setup ----------
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ===== helper: normalize topK -> 4 bins =====
function normalizeTopK(result) {
  const topK =
    Array.isArray(result?.topK) && result.topK.length > 0
      ? result.topK
      : [{ label: result.label, confidence: result.confidence }];

  const mappedTopK = topK.map((x) => ({
    label: LABEL_MAP[x.label] || x.label,
    confidence: x.confidence,
  }));

  // กันซ้ำ label
  const seen = new Set();
  const unique = [];
  for (const item of mappedTopK) {
    if (seen.has(item.label)) continue;
    seen.add(item.label);
    unique.push(item);
    if (unique.length >= 3) break;
  }

  return unique;
}

/**
 * ✅ Live Scan Preview: ไม่บันทึก / ไม่แนะนำการทิ้ง
 * POST /predict/preview
 */
router.post("/predict/preview", auth, upload.single("image"), async (req, res) => {
  try {
    const result = await predictController.predictWaste(req);
    const topK = normalizeTopK(result);
    return res.json({ topK });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
      detail: err.detail,
    });
  }
});

/**
 * ✅ Capture Predict (รูปเดียว)
 * POST /predict
 */
router.post("/predict", auth, upload.single("image"), async (req, res) => {
  try {
    const result = await predictController.predictWaste(req);
    const user = await User.findById(req.user.id).select("username");

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const topK = normalizeTopK(result);
    const best = topK[0] || {
      label: LABEL_MAP[result.label] || result.label,
      confidence: result.confidence,
    };

    const doc = await Usage.create({
      userId: req.user.id,
      username: user?.username,
      imagePath,
      label: best.label,
      confidence: best.confidence,
      suggestion: result.suggestion,
      topK,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const metaBest = CLASS_META[best.label] || { title: "Unknown", desc: "Unknown" };

    const alternatives = topK.slice(1, 3).map((x) => {
      const m = CLASS_META[x.label] || { title: "Unknown", desc: "Unknown" };
      return { ...x, title: m.title, desc: m.desc };
    });

    return res.json({
      predictionId: doc._id,
      imageUrl: toPublicUrl(imagePath),
      predicted: {
        label: best.label,
        confidence: best.confidence,
        title: metaBest.title,
        desc: metaBest.desc,
      },
      alternatives,
      suggestion: result.suggestion || "",
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
      detail: err.detail,
    });
  }
});

/**
 * ✅ Batch Predict (หลายรูป)
 * POST /predict/batch
 * form-data: images (many)
 */
router.post("/predict/batch", auth, upload.array("images", 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "No images uploaded" });

    const user = await User.findById(req.user.id).select("username");
    const results = [];

    for (const file of files) {
      const fakeReq = { ...req, file };

      const result = await predictController.predictWaste(fakeReq);

      const imagePath = file ? `/uploads/${file.filename}` : null;

      const topK = normalizeTopK(result);
      const best = topK[0] || {
        label: LABEL_MAP[result.label] || result.label,
        confidence: result.confidence,
      };

      const doc = await Usage.create({
        userId: req.user.id,
        username: user?.username,
        imagePath,
        label: best.label,
        confidence: best.confidence,
        suggestion: result.suggestion,
        topK,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      const metaBest = CLASS_META[best.label] || { title: "Unknown", desc: "Unknown" };

      const alternatives = topK.slice(1, 3).map((x) => {
        const m = CLASS_META[x.label] || { title: "Unknown", desc: "Unknown" };
        return { ...x, title: m.title, desc: m.desc };
      });

      results.push({
        predictionId: doc._id,
        imageUrl: toPublicUrl(imagePath),
        predicted: {
          label: best.label,
          confidence: best.confidence,
          title: metaBest.title,
          desc: metaBest.desc,
        },
        alternatives,
        suggestion: result.suggestion || "",
      });
    }

    return res.json(results);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Server error",
      detail: err.detail,
    });
  }
});

module.exports = router;