# train2.py
import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

print("START TRAIN2.PY")

# ---------- CONFIG ----------
DATA_DIR_TRAIN = r"D:\Data\data_general\train"
DATA_DIR_VAL   = r"D:\Data\data_general\val"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

EPOCHS_HEAD = 12         # เทรนส่วนหัว (classifier) ก่อน
EPOCHS_FT   = 12         # fine-tune ต่อ
FINE_TUNE_AT = 120       # ยิ่งมาก = ปลดล็อกเลเยอร์มากขึ้น (เริ่มที่ 120 กำลังดี)

MODEL_PATH  = "bin4_model.keras"
CLASSES_TXT = "bin4_classes.txt"

# ---------- DATA ----------
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR_TRAIN,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=True,
    label_mode="int"
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR_VAL,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False,
    label_mode="int"
)

class_names = train_ds.class_names
num_classes = len(class_names)
print("Class names:", class_names)

# speed up
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache(r"D:\Data\data_general\train_cache").prefetch(AUTOTUNE)
val_ds   = val_ds.cache(r"D:\Data\data_general\val_cache").prefetch(AUTOTUNE)

# ---------- CLASS WEIGHT (ลด bias) ----------
# ดึง label ทั้งหมดจาก train_ds แล้วคำนวณ weight อัตโนมัติ
y_all = np.concatenate([y.numpy() for _, y in train_ds])
counts = np.bincount(y_all, minlength=num_classes)
total = counts.sum()
class_weight = {i: float(total / (num_classes * counts[i])) for i in range(num_classes) if counts[i] > 0}
print("Counts per class:", {class_names[i]: int(counts[i]) for i in range(num_classes)})
print("Class weight:", class_weight)

# ---------- AUGMENTATION (ช่วยรูปถ่ายจริง/เงา/มุม) ----------
data_augmentation = keras.Sequential(
    [
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.2),
        layers.RandomTranslation(0.15, 0.15),
        layers.RandomContrast(0.25),
        # หมายเหตุ: ถ้า TF เวอร์ชันคุณมี RandomBrightness ใช้เพิ่มได้
        # layers.RandomBrightness(0.2),
    ],
    name="augmentation"
)

# ---------- MODEL (MobileNetV2) ----------
base_model = tf.keras.applications.MobileNetV2(
    input_shape=IMG_SIZE + (3,),
    include_top=False,
    weights="imagenet"
)
base_model.trainable = False  # เฟสแรก freeze ก่อน

inputs = keras.Input(shape=IMG_SIZE + (3,))
x = data_augmentation(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(num_classes, activation="softmax")(x)

model = keras.Model(inputs, outputs)

# ---------- CALLBACKS ----------
callbacks = [
    keras.callbacks.ModelCheckpoint(
        filepath="bin4_best.keras",
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
        verbose=1
    ),
    keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=4,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=1e-6,
        verbose=1
    )
]

# ---------- TRAIN: HEAD ----------
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

print("\n=== TRAIN HEAD ===")
history_head = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS_HEAD,
    class_weight=class_weight,
    callbacks=callbacks
)

# ---------- FINE-TUNE ----------
print("\n=== FINE TUNE ===")
base_model.trainable = True

# freeze ชั้นต้น ๆ ไว้ (กันพัง)
for layer in base_model.layers[:FINE_TUNE_AT]:
    layer.trainable = False

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-5),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

history_ft = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS_HEAD + EPOCHS_FT,
    initial_epoch=len(history_head.epoch),
    class_weight=class_weight,
    callbacks=callbacks
)

# ---------- SAVE FINAL + CLASSES ----------
model.save(MODEL_PATH)
print(f"Saved model to {MODEL_PATH}")

with open(CLASSES_TXT, "w", encoding="utf-8") as f:
    for name in class_names:
        f.write(name + "\n")
print(f"Saved class names to {CLASSES_TXT}")

print("DONE")
