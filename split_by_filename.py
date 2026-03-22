import os, re, shutil, random

# ====== ตั้งค่า ======
SRC_DIR = r"D:\Data\dataset_raw"
OUT_DIR = r"D:\Data\dataset_out"
TRAIN_RATIO = 0.8
SEED = 42
COPY_MODE = True
IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")

# ✅ คราวนี้ "ไม่ล็อค" คลาส (ให้ว่าง) เพื่อให้ cardboard/metal/biodegradable ผ่าน
ALLOWED_CLASSES = set()

# ✅ map ชื่อคลาสให้เป็นชื่อมาตรฐานที่คุณใช้
ALIASES = {
    "biodegradable": "biological",     # ถ้าคุณอยากให้ biodegradable ไปอยู่ biological
    "bio": "biological",
    "cardboard": "cardboard",
    "metal": "metal",
    "plastic": "plastic",
    "glass": "glass",
    "paper": "paper",
    "trash": "trash",
    "battery": "battery",
    # e-waste
    "mobile": "mobile",
    "keyboard": "keyboard",
    "mouse": "mouse",
    "pcb": "pcb",
    "printer": "printer",
    "television": "television",
    "washing_machine": "washing_machine",
    "microwave": "microwave",
    "player": "player",
}

def put_file(src_path, dst_path):
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    if COPY_MODE:
        shutil.copy2(src_path, dst_path)
    else:
        shutil.move(src_path, dst_path)

def guess_class(filename: str):
    """
    รองรับชื่อไฟล์แนว:
    - biodegradable15__jpg.rf.xxxxx.jpg
    - cardboard594__jpg.rf.xxxxx.jpg
    - metal1035_jpg.rf.xxxxx.jpg
    - IMG_20250822_30901_jpg.rf....jpg  -> unknown
    """
    stem = os.path.splitext(filename)[0].lower()

    # ถ้าเป็นไฟล์กล้องที่ไม่มี label นำหน้า
    if stem.startswith("img_") or stem.startswith("dsc"):
        return None

    # เอา prefix ตัวอักษรล้วนๆ ก่อนตัวเลข เช่น "metal1035..." -> "metal"
    m = re.match(r"([a-z_]+)", stem)
    if not m:
        return None

    token = m.group(1).strip("_")

    # normalize เช่น washing__machine -> washing_machine
    token = re.sub(r"_+", "_", token)

    # map alias -> class มาตรฐาน
    token = ALIASES.get(token, token)

    # ถ้ามี allowed_classes ให้บังคับ (ตอนนี้เราไม่บังคับ)
    if ALLOWED_CLASSES and token not in ALLOWED_CLASSES:
        return None

    # กันพลาด: ถ้าคลาสไม่ใช่ตัวอักษร/underscore
    if not re.match(r"^[a-z_]+$", token):
        return None

    return token

def main():
    random.seed(SEED)

    files = [f for f in os.listdir(SRC_DIR) if f.lower().endswith(IMG_EXTS)]
    print("Total images found:", len(files))

    by_class = {}
    unknown = []

    for f in files:
        cls = guess_class(f)
        if cls is None:
            unknown.append(f)
        else:
            by_class.setdefault(cls, []).append(f)

    print("\nClasses detected:")
    for cls, flist in sorted(by_class.items(), key=lambda x: (-len(x[1]), x[0])):
        print(f" - {cls}: {len(flist)}")

    print("\nUnknown:", len(unknown))

    for cls, flist in by_class.items():
        random.shuffle(flist)
        cut = max(1, int(len(flist) * TRAIN_RATIO))  # กันคลาสรูปน้อยจน train ว่าง
        train_list = flist[:cut]
        val_list = flist[cut:]

        for f in train_list:
            put_file(os.path.join(SRC_DIR, f), os.path.join(OUT_DIR, "train", cls, f))
        for f in val_list:
            put_file(os.path.join(SRC_DIR, f), os.path.join(OUT_DIR, "val", cls, f))

    for f in unknown:
        put_file(os.path.join(SRC_DIR, f), os.path.join(OUT_DIR, "unknown", f))

    print("\n✅ Done.")
    print("Output:", OUT_DIR)

if __name__ == "__main__":
    main()
