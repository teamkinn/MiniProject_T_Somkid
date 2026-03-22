require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

// ✅ serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB(process.env.MONGO_URI);

// routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/predictRoutes"));
app.use("/api", require("./routes/profileRoutes"));
app.use("/api", require("./routes/adminRoutes"));
app.use("/api", require("./routes/feedbackRoutes"));
app.use("/api", require("./routes/historyRoutes"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on", PORT));