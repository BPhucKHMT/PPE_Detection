# rf_detr_loader.py

from rfdetr import RFDETRMedium
from PIL import Image, ImageDraw, ImageFont

label_mapping = {
    0: "SH17",
    1: "ear",
    2: "earmuffs",
    3: "face",
    4: "face-guard",
    5: "face-mask-medical",
    6: "foot",
    7: "glasses",
    8: "gloves",
    9: "hands",
    10: "head",
    11: "helmet",
    12: "medical-suit",
    13: "person",
    14: "safety-suit",
    15: "safety-vest",
    16: "shoes",
    17: "tools",
}

# ================================
# 🎨 BẢNG MÀU CHO MỖI CLASS
# ================================
COLORS = [
    (255, 0, 0),      # red
    (0, 255, 0),      # green
    (0, 150, 255),    # blue-ish
    (255, 255, 0),    # yellow
    (255, 0, 255),    # fuchsia
    (0, 255, 255),    # cyan
    (255, 128, 0),    # orange
    (128, 0, 255),    # purple
    (0, 128, 255),    # sky blue
    (0, 255, 128),    # light green
    (255, 0, 128),    # pink
    (128, 255, 0),    # lime
    (255, 128, 128),  # soft red
    (128, 128, 255),  # soft blue
    (255, 255, 128),  # soft yellow
    (128, 255, 128),  # mint
    (255, 128, 255),  # light pink
    (128, 255, 255),  # light cyan
]


def load_rfdetr(weights="checkpoint_best_total.pth"):
    """
    Load RF-DETR model từ checkpoint .pth của bạn.
    """
    print(f"🔄 Loading RF-DETR from {weights} ...")
    model = RFDETRMedium(pretrain_weights=weights)
    #model.optimize_for_inference()
    print("✅ RF-DETR ready for inference!")
    return model


def infer_rfdetr(model, image, conf=0.5):
    """
    Inference RF-DETR trên 1 ảnh PIL.
    Trả về (ảnh đã vẽ bbox, detections gốc).
    """
    if not isinstance(image, Image.Image):
        image = Image.fromarray(image).convert("RGB")
    else:
        image = image.convert("RGB")

    detections = model.predict(image, threshold=conf)

    out = image.copy()
    draw = ImageDraw.Draw(out)

    # Load font
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()

    # Vẽ từng hộp
    for xyxy, cls_id, score in zip(
        detections.xyxy,
        detections.class_id,
        detections.confidence,
    ):
        x1, y1, x2, y2 = map(int, xyxy)
        cls_id = int(cls_id)
        label = f"{label_mapping[cls_id]} ({score:.2f})"

        # 🎨 chọn màu theo class
        color = COLORS[cls_id % len(COLORS)]

        # Vẽ bbox
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        # Tính size text bằng textbbox
        bbox = draw.textbbox((x1, y1), label, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

        # Vẽ nền label (semi-transparent)
        draw.rectangle([x1, y1 - th, x1 + tw, y1], fill=color)

        # Text màu trắng
        draw.text((x1, y1 - th), label, font=font, fill="black")

    return out, detections
