const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const feedbackController = require("../controllers/feedbackController");

// POST /api/feedback
router.post("/feedback", auth, feedbackController.submitFeedback);

module.exports = router;
