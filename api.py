from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)

MODEL_PATH = "bin4_model.keras"
CLASSES_PATH = "bin4_classes.txt"

model = keras.models.load_model(MODEL_PATH)

CLASSES = []
if os.path.exists(CLASSES_PATH):
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        CLASSES = [line.strip() for line in f if line.strip()]

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

def make_advice(label: str) -> str:
    l = label.lower()
    if l == "plastic":
        return "ล้างให้สะอาดแล้วทิ้งถังรีไซเคิลพลาสติก"
    if l == "paper":
        return "พับ/มัดให้เรียบร้อยแล้วทิ้งถังรีไซเคิลกระดาษ"
    if l == "glass":
        return "ระวังบาด ใส่กล่อง/ห่อก่อนทิ้งถังแก้ว"
    if l == "metal":
        return "ล้างคราบอาหาร แล้วทิ้งถังรีไซเคิลโลหะ"
    if l == "organic" or l == "biological":
        return "ทิ้งถังขยะเปียก/อินทรีย์"
    if l == "battery":
        return "แยกทิ้งจุดรับแบตเตอรี่/ขยะอันตราย"
    if l == "cardboard":
        return "พับกล่องให้แบน แล้วทิ้งรีไซเคิลกระดาษ/ลัง"
    if l == "clothes" or l == "shoes":
        return "ถ้ายังใช้ได้บริจาคได้ ถ้าไม่ได้ให้ทิ้งตามจุดรับ/ขยะทั่วไป"
    return "แยกทิ้งตามถังที่เหมาะสม หรือถังขยะทั่วไป"

def do_predict(image_bytes: bytes):
    x = preprocess_image(image_bytes)
    preds = model.predict(x, verbose=0)[0]
    idx = int(np.argmax(preds))
    conf = float(preds[idx])
    label = CLASSES[idx] if idx < len(CLASSES) else str(idx)
    advice = make_advice(label)
    return label, conf, advice

# ✅ รองรับทั้ง /predict และ /classify
@app.post("/predict")
@app.post("/classify")
def predict():
    # ✅ รองรับทั้ง field "file" (จาก Node) และ "image" (จาก Frontend)
    f = request.files.get("file") or request.files.get("image")
    if not f:
        return jsonify({"error": "missing file field (use 'file' or 'image')"}), 400

    image_bytes = f.read()
    label, conf, advice = do_predict(image_bytes)

    return jsonify({
        "label": label,
        "confidence": conf,
        "suggestion": advice
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
