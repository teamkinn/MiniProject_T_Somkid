# predict.py
import tensorflow as tf
from tensorflow import keras
import numpy as np
import os

MODEL_PATH = "waste_model.keras"
CLASSES_TXT = "classes.txt"
IMG_SIZE = (224, 224)

# ----- 1. โหลดโมเดล -----
print(f"Loading model from {MODEL_PATH} ...")
model = keras.models.load_model(MODEL_PATH)

# ----- 2. โหลดชื่อคลาส -----
with open(CLASSES_TXT, "r", encoding="utf-8") as f:
    class_names = [line.strip() for line in f.readlines()]

print("Class names:", class_names)

# ----- 3. กำหนด rule วิธีทิ้ง -----
dispose_rules = {
    "cardboard": "กระดาษแข็ง รีไซเคิลได้ ทิ้งถังรีไซเคิลหรือรวบรวมขายได้",
    "glass": "แก้ว/ขวดแก้ว ล้างให้สะอาด ทิ้งถังแก้วหรือถังรีไซเคิล",
    "metal": "โลหะ/กระป๋อง ทิ้งถังรีไซเคิลหรือขายของเก่าได้",
    "paper": "กระดาษ รีไซเคิลได้ ทิ้งถังรีไซเคิลหรือรวบรวมขายได้",
    "plastic": "พลาสติก ล้างให้สะอาด ทิ้งถังรีไซเคิล",
    "trash": "ขยะทั่วไป รีไซเคิลไม่ได้ ทิ้งถังขยะทั่วไป"
}

# ----- 4. ฟังก์ชันเตรียมรูปและทำนาย -----
def load_and_preprocess_image(img_path: str) -> tf.Tensor:
    img = tf.keras.utils.load_img(img_path, target_size=IMG_SIZE)
    img_array = tf.keras.utils.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)  # เพิ่มมิติ batch
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return img_array

def predict_image(img_path: str) -> None:
    img_batch = load_and_preprocess_image(img_path)
    preds = model.predict(img_batch)
    preds = np.array(preds)

    prob = float(np.max(preds[0]))
    class_idx = int(np.argmax(preds[0]))
    class_name = class_names[class_idx]

    rule = dispose_rules.get(
        class_name,
        "ยังไม่มีคำแนะนำการทิ้งสำหรับประเภทนี้"
    )

    print(f"\nไฟล์รูป: {img_path}")
    print(f"ประเภทขยะที่ทำนายได้: {class_name} (ความมั่นใจ {prob*100:.2f}%)")
    print(f"คำแนะนำการทิ้ง: {rule}")

# ----- 5. ทำนายรูปทุกไฟล์ในโฟลเดอร์ -----
if __name__ == "__main__":
    folder_path = r"D:\Data\Test"  # โฟลเดอร์ที่เก็บรูปทดสอบ

    if not os.path.isdir(folder_path):
        print("ไม่พบโฟลเดอร์ ลองตรวจสอบ path อีกครั้ง")
    else:
        image_exts = (".jpg", ".jpeg", ".png", ".bmp")
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(image_exts)]

        if not files:
            print("ในโฟลเดอร์ยังไม่มีไฟล์รูป (.jpg/.png)")
        else:
            for fname in files:
                img_path = os.path.join(folder_path, fname)
                predict_image(img_path)
