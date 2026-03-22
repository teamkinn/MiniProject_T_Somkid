const Usage = require("../models/Usage");

exports.submitFeedback = async (req, res) => {
  try {
    const { predictionId, isCorrect, correctedLabel } = req.body;

    if (!predictionId) {
      return res.status(400).json({ message: "predictionId is required" });
    }
    if (typeof isCorrect !== "boolean") {
      return res.status(400).json({ message: "isCorrect must be boolean" });
    }

    // ถ้า user บอกว่าผิด ต้องมี correctedLabel
    if (isCorrect === false) {
      const allowed = ["general", "recycle", "organic", "hazardous"];
      if (!correctedLabel || !allowed.includes(correctedLabel)) {
        return res.status(400).json({
          message: "correctedLabel must be one of: general, recycle, organic, hazardous",
        });
      }
    }

    const update = {
      isCorrect,
      feedbackAt: new Date(),
      correctedLabel: isCorrect ? null : correctedLabel,
    };

    const doc = await Usage.findByIdAndUpdate(predictionId, update, {
      new: true,
    });

    if (!doc) {
      return res.status(404).json({ message: "History not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
};
