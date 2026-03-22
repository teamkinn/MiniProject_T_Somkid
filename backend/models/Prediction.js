const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String }, // เก็บซ้ำไว้เพื่อค้นเร็ว (optional)

    imagePath: { type: String }, // หรือ imageUrl แล้วแต่ระบบคุณ
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
      default: null, // null = user ยังไม่กดตอบ
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

module.exports = mongoose.model("Prediction", predictionSchema);
