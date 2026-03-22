const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

exports.predictWaste = async (req) => {
  if (!req.file) {
    const err = new Error("No image uploaded");
    err.status = 400;
    throw err;
  }

  if (!fs.existsSync(req.file.path)) {
    const err = new Error("Uploaded file not found on server");
    err.status = 500;
    throw err;
  }

  const form = new FormData();
  form.append("image", fs.createReadStream(req.file.path));

  try {
    const pyRes = await axios.post("http://127.0.0.1:8001/predict", form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });

    // ต้องได้ {label, confidence, suggestion}
    return pyRes.data;
  } catch (e) {
    const err = new Error("Prediction service error");
    err.status = 502;
    err.detail = e?.response?.data || e.message;
    throw err;
  }
};
