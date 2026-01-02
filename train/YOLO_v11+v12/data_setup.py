"""Data conversion script from COCO to YOLO format."""

import json
import shutil
from pathlib import Path
import yaml


def coco_bbox_to_yolo(bbox, W, H):
    """
    Convert COCO bbox to YOLO format.

    Args:
        bbox: [x, y, width, height] - COCO format (top-left corner)
        W: image width
        H: image height

    Returns:
        x_center, y_center, width, height - YOLO format (normalized 0-1)
    """
    x, y, w, h = bbox
    x_center = (x + w / 2) / W
    y_center = (y + h / 2) / H
    w_yolo = w / W
    h_yolo = h / H
    return x_center, y_center, w_yolo, h_yolo


def convert_coco_to_yolo(output_dir, data_dir, split_name):
    """
    Convert COCO format annotations to YOLO format.

    Args:
        output_dir: output directory for YOLO format (e.g., 'data_yolo')
        data_dir: source data directory containing COCO format (e.g., 'data')
        split_name: split name (train/valid/test)

    Returns:
        categories_dict: dictionary of categories {id: category_info}
    """
    # Tìm file JSON trong thư mục split
    src_split_dir = Path(data_dir) / split_name
    ann_path = src_split_dir / "_annotations.coco.json"

    if not ann_path.exists():
        print(f"Warning: {ann_path} not found, skipping {split_name}")
        return None

    print(f"Converting {split_name}...")
    print(f"  Reading: {ann_path}")

    # Đọc COCO JSON
    with open(ann_path, "r", encoding="utf-8") as f:
        coco = json.load(f)

    images = coco.get("images", [])
    annotations = coco.get("annotations", [])
    categories = coco.get("categories", [])

    # Lọc bỏ category 'SH17' (supercategory)
    categories = [cat for cat in categories if cat["name"] != "SH17"]

    # Tạo categories dict
    categories_dict = {cat["id"]: cat for cat in categories}

    # Tạo mapping từ old category_id sang new category_id (0-based)
    old_to_new_id = {}
    for new_id, cat in enumerate(sorted(categories, key=lambda x: x["id"])):
        old_to_new_id[cat["id"]] = new_id

    print(f"  Total categories: {len(categories_dict)}")

    # Index annotations theo image_id (lọc bỏ annotations có category SH17)
    ann_by_image = {}
    for ann in annotations:
        if (
            ann["category_id"] in old_to_new_id
        ):  # Chỉ giữ annotations thuộc categories hợp lệ
            img_id = ann["image_id"]
            ann_by_image.setdefault(img_id, []).append(ann)

    # Tạo output directories
    dst_split_dir = Path(output_dir) / split_name
    dst_img_dir = dst_split_dir / "images"
    dst_lbl_dir = dst_split_dir / "labels"
    dst_img_dir.mkdir(parents=True, exist_ok=True)
    dst_lbl_dir.mkdir(parents=True, exist_ok=True)

    print(f"  Output images: {dst_img_dir}")
    print(f"  Output labels: {dst_lbl_dir}")

    # Duyệt từng ảnh
    converted_count = 0
    for img in images:
        img_id = img["id"]
        file_name = img["file_name"]
        W = img["width"]
        H = img["height"]

        # Tìm ảnh source
        src_img_path = src_split_dir / file_name
        if not src_img_path.exists():
            # Thử tìm theo tên file (nếu COCO có path con)
            src_img_path = src_split_dir / Path(file_name).name

        if not src_img_path.exists():
            print(f"  [WARN] Image not found: {file_name}")
            continue

        # Copy ảnh sang output
        dst_img_path = dst_img_dir / src_img_path.name
        if not dst_img_path.exists():
            shutil.copy2(src_img_path, dst_img_path)

        # Tạo label YOLO
        label_lines = []
        for ann in ann_by_image.get(img_id, []):
            cat_id = ann["category_id"]

            # Map từ old category_id sang new category_id (0-based index)
            if cat_id not in old_to_new_id:
                continue  # Skip nếu là SH17 hoặc category không hợp lệ

            class_id = old_to_new_id[cat_id]

            bbox = ann["bbox"]
            x_c, y_c, w_y, h_y = coco_bbox_to_yolo(bbox, W, H)

            # Clamp về [0,1] để an toàn
            x_c = min(max(x_c, 0.0), 1.0)
            y_c = min(max(y_c, 0.0), 1.0)
            w_y = min(max(w_y, 0.0), 1.0)
            h_y = min(max(h_y, 0.0), 1.0)

            label_lines.append(f"{class_id} {x_c:.6f} {y_c:.6f} {w_y:.6f} {h_y:.6f}")

        # Ghi file txt (rỗng nếu không có object)
        label_name = dst_img_path.stem + ".txt"
        dst_label_path = dst_lbl_dir / label_name
        with open(dst_label_path, "w", encoding="utf-8") as f:
            f.write("\n".join(label_lines))

        converted_count += 1

    print(f"  Converted: {converted_count} images")

    return categories_dict, old_to_new_id


def create_yolo_dataset(source_data_dir="data", output_data_dir="data_yolo"):
    """
    Convert COCO dataset to YOLO format.

    Args:
        source_data_dir: directory containing COCO format data
        output_data_dir: directory for YOLO format data
    """
    print("=" * 80)
    print("CONVERTING COCO DATASET TO YOLO FORMAT")
    print("=" * 80)
    print(f"Source: {source_data_dir}")
    print(f"Output: {output_data_dir}\n")

    # Kiểm tra thư mục source
    source_path = Path(source_data_dir)
    if not source_path.exists():
        print(f"Error: Source directory '{source_data_dir}' not found!")
        return

    output_path = Path(output_data_dir)

    # Process từng split
    splits = ["train", "valid", "test"]
    categories_dict = None
    old_to_new_id = None

    for split in splits:
        result = convert_coco_to_yolo(output_data_dir, source_data_dir, split)

        if result is not None:
            categories, mapping = result
            if categories_dict is None:
                categories_dict = categories
                old_to_new_id = mapping

        print()  # Xuống dòng

    # Tạo data.yaml
    if categories_dict and old_to_new_id:
        # Tạo class names dict với index mới (0-based, không có SH17)
        class_names = {}
        for old_id, new_id in sorted(old_to_new_id.items(), key=lambda x: x[1]):
            class_names[new_id] = categories_dict[old_id]["name"]

        data_yaml = {
            "path": str(output_path.absolute()),
            "train": "train/images",
            "val": "valid/images",
            "test": "test/images",
            "nc": len(categories_dict),
            "names": class_names,
        }

        yaml_path = output_path / "data.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(data_yaml, f, sort_keys=False)

        print("=" * 80)
        print("CONVERSION COMPLETED!")
        print("=" * 80)
        print(f"Created: {yaml_path}")
        print(f"\nDataset info:")
        print(f"  - Number of classes: {len(categories_dict)}")
        print(f"  - Classes: {list(class_names.values())}")
        print(f"\nYou can now run: python train.py")
    else:
        print("\nError: No categories found in any split!")


def verify_dataset(data_dir="data_yolo"):
    """Verify YOLO dataset structure."""
    print("\n" + "=" * 80)
    print("VERIFYING DATASET")
    print("=" * 80)

    data_path = Path(data_dir)

    if not data_path.exists():
        print(f"Error: {data_path} not found!")
        return

    print(f"Dataset location: {data_path.absolute()}\n")

    # Kiểm tra từng split
    for split in ["train", "valid", "test"]:
        split_path = data_path / split
        if split_path.exists():
            img_path = split_path / "images"
            label_path = split_path / "labels"

            img_count = len(list(img_path.glob("*"))) if img_path.exists() else 0
            label_count = (
                len(list(label_path.glob("*.txt"))) if label_path.exists() else 0
            )

            print(f"  {split:6s}: {img_count:5d} images, {label_count:5d} labels")
        else:
            print(f"  {split:6s}: not found")

    # Kiểm tra data.yaml
    yaml_path = data_path / "data.yaml"
    if yaml_path.exists():
        print(f"\ndata.yaml found at: {yaml_path}")
        with open(yaml_path, "r") as f:
            config = yaml.safe_load(f)
        print(f"\nConfiguration:")
        for key, value in config.items():
            if key == "names":
                print(f"  {key}: {len(value)} classes")
            else:
                print(f"  {key}: {value}")
    else:
        print(f"\nWarning: data.yaml not found!")

    print("=" * 80)


if __name__ == "__main__":
    # Convert COCO to YOLO format
    # Thay đổi đường dẫn chứa data gốc tùy theo nơi bạn lưu data
    create_yolo_dataset(source_data_dir="data", output_data_dir="data_yolo")

    # Verify dataset
    verify_dataset("data_yolo")
