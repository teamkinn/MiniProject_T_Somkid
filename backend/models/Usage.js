const mongoose = require("mongoose");

// เก็บประวัติการใช้งาน/ผลการทำนาย (Usage History)
const usageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String }, // เก็บซ้ำเพื่อค้นหาเร็ว (optional)

    imagePath: { type: String },
    label: { type: String, required: true },
    confidence: { type: Number, required: true },
    suggestion: { type: String },

    ip: { type: String },
    userAgent: { type: String },

    topK: [
      {
        label: {
          type: String,
          enum: ["general", "recycle", "organic", "hazardous"],
        },
        confidence: { type: Number },
      },
    ],

    isCorrect: {
      type: Boolean,
      default: null,
    },

    correctedLabel: {
      type: String,
      enum: ["general", "recycle", "organic", "hazardous"],
      default: null,
    },

    feedbackAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Usage", usageSchema);
