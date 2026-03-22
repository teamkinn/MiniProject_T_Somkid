import numpy as np
import tensorflow as tf
from PIL import Image

model = tf.keras.models.load_model("bin4_best.keras")
class_names = [l.strip() for l in open("bin4_classes.txt", encoding="utf-8") if l.strip()]

img = Image.open("ขวด.jpg").convert("RGB").resize((224,224))
x = np.array(img).astype(np.float32)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = np.expand_dims(x, 0)

prob = model.predict(x, verbose=0)[0]
idx = int(np.argmax(prob))
print("Loaded model:", model.name)
print("class_names:", class_names)
print("num_classes:", len(class_names))
print("model output:", model.output_shape)

print("predict:", class_names[idx], "conf:", float(prob[idx]))
print("top3:", [(class_names[i], float(prob[i])) for i in np.argsort(prob)[::-1][:3]])
