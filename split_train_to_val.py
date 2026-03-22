import os
import random
import shutil
from pathlib import Path

# ====== CONFIG ======
ROOT = Path(r"D:\Data\data_general")   # <-- เปลี่ยนได้ถ้า path คุณต่าง
TRAIN = ROOT / "train"
VAL   = ROOT / "val"

CLASSES = ["general", "organic", "recycle"]  # ไม่แตะ hazardous
VAL_RATIO = 0.20
SEED = 42

# ถ้าอยากลองก่อนโดยไม่ย้ายไฟล์จริง ให้ตั้งเป็น True
DRY_RUN = False

# นามสกุลไฟล์รูปที่ยอมรับ
IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ====== LOGIC ======
random.seed(SEED)

def list_images(folder: Path):
    files = []
    for p in folder.iterdir():
        if p.is_file() and p.suffix.lower() in IMG_EXTS:
            files.append(p)
    return files

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def move_file(src: Path, dst: Path):
    ensure_dir(dst.parent)
    if DRY_RUN:
        print(f"[DRY] MOVE {src.name} -> {dst}")
        return
    # กันชื่อชน: ถ้าปลายทางมีชื่อซ้ำ เติม _1 _2 ...
    if dst.exists():
        stem, suf = dst.stem, dst.suffix
        i = 1
        while True:
            new_dst = dst.with_name(f"{stem}_{i}{suf}")
            if not new_dst.exists():
                dst = new_dst
                break
            i += 1
    shutil.move(str(src), str(dst))

def main():
    print("ROOT:", ROOT)
    print("TRAIN:", TRAIN)
    print("VAL:", VAL)
    print("Classes:", CLASSES)
    print("VAL_RATIO:", VAL_RATIO, "SEED:", SEED, "DRY_RUN:", DRY_RUN)
    print("--------------------------------------------------")

    for cls in CLASSES:
        train_dir = TRAIN / cls
        val_dir = VAL / cls
        ensure_dir(val_dir)

        if not train_dir.exists():
            print(f"[SKIP] missing train folder: {train_dir}")
            continue

        files = list_images(train_dir)
        n = len(files)

        if n == 0:
            print(f"[WARN] no images in {train_dir}")
            continue

        k = int(n * VAL_RATIO)
        if k < 1 and n >= 5:
            k = 1  # อย่างน้อยย้าย 1 รูปถ้ามีรูปพอ
        if k == 0:
            print(f"[INFO] {cls}: only {n} images, skip moving to val")
            continue

        random.shuffle(files)
        picked = files[:k]

        print(f"[{cls}] train={n} -> move_to_val={k}")

        for src in picked:
            dst = val_dir / src.name
            move_file(src, dst)

    print("--------------------------------------------------")
    print("DONE")

if __name__ == "__main__":
    main()
