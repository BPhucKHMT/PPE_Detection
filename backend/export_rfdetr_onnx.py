from __future__ import annotations

import shutil
from pathlib import Path

from rfdetr import RFDETRMedium

CHECKPOINT = Path("backend/models/checkpoint_best_total.pth")
OUTPUT = Path("backend/models/rfdetr_medium.onnx")
EXPORT_DIR = Path("backend/models/rfdetr_onnx_export")


def export_rfdetr_onnx(
    checkpoint_path: Path = CHECKPOINT,
    output_path: Path = OUTPUT,
    export_dir: Path = EXPORT_DIR,
) -> Path:
    if not checkpoint_path.exists():
        raise FileNotFoundError(checkpoint_path)

    export_dir.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    model = RFDETRMedium(pretrain_weights=str(checkpoint_path))
    model.export(output_dir=str(export_dir), simplify=False, opset_version=17, force=True, verbose=False)

    exported_path = export_dir / "inference_model.onnx"
    if not exported_path.exists():
        raise FileNotFoundError(exported_path)

    shutil.copy2(exported_path, output_path)
    return output_path


def main() -> None:
    output_path = export_rfdetr_onnx()
    print(f"RF-DETR ONNX exported to {output_path}")


if __name__ == "__main__":
    main()
