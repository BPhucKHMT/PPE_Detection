from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

from backend.app.core.config import DEVICE_LABEL, MODEL_DIR
from backend.model_runtime import DetectionRuntime
from backend.rfdetr_runtime import RFDETRNativeRuntime, RFDETRONNXRuntime, RFDETRTensorRTRuntime

logger = logging.getLogger(__name__)


def choose_rfdetr_runtime_model(model_dir: Path = MODEL_DIR) -> tuple[str, str]:
    fp32_engine_path = model_dir / "rfdetr_medium_fp32.engine"
    if fp32_engine_path.exists():
        return str(fp32_engine_path), "rfdetr-tensorrt"

    engine_path = model_dir / "rfdetr_medium.engine"
    if engine_path.exists():
        return str(engine_path), "rfdetr-tensorrt"

    onnx_path = model_dir / "rfdetr_medium.onnx"
    if onnx_path.exists():
        return str(onnx_path), "rfdetr-onnx"

    checkpoint_path = model_dir / "checkpoint_best_total.pth"
    return str(checkpoint_path), "rfdetr-native"


def _runtime_candidates(model_dir: Path = MODEL_DIR) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []

    fp32_engine_path = model_dir / "rfdetr_medium_fp32.engine"
    if fp32_engine_path.exists():
        candidates.append((str(fp32_engine_path), "rfdetr-tensorrt"))

    engine_path = model_dir / "rfdetr_medium.engine"
    if engine_path.exists():
        candidates.append((str(engine_path), "rfdetr-tensorrt"))

    onnx_path = model_dir / "rfdetr_medium.onnx"
    if onnx_path.exists():
        candidates.append((str(onnx_path), "rfdetr-onnx"))

    checkpoint_path = model_dir / "checkpoint_best_total.pth"
    if checkpoint_path.exists():
        candidates.append((str(checkpoint_path), "rfdetr-native"))

    return candidates


MODEL_PATH, MODEL_BACKEND = choose_rfdetr_runtime_model()


def get_runtime_info(model_backend: str, model_path: str, device_label: str) -> dict[str, str]:
    return {
        "status": "ok",
        "model_backend": model_backend,
        "model_path": model_path,
        "device": device_label,
    }


def _build_runtime(model_backend: str, model_path: str) -> DetectionRuntime:
    if model_backend == "rfdetr-tensorrt":
        return RFDETRTensorRTRuntime(model_path, device=DEVICE_LABEL)
    if model_backend == "rfdetr-onnx":
        return RFDETRONNXRuntime(model_path)
    return RFDETRNativeRuntime(model_path)


@lru_cache(maxsize=1)
def get_detection_runtime() -> DetectionRuntime:
    preferred = [(MODEL_PATH, MODEL_BACKEND)]
    fallback = [candidate for candidate in _runtime_candidates() if candidate != preferred[0]]

    attempts = preferred + fallback
    last_error: Exception | None = None

    for model_path, model_backend in attempts:
        try:
            runtime = _build_runtime(model_backend, model_path)
            logger.info(
                "[runtime] initialized backend=%s path=%s device=%s",
                model_backend,
                model_path,
                DEVICE_LABEL,
            )
            return runtime
        except Exception as error:
            last_error = error
            logger.exception(
                "[runtime] failed backend=%s path=%s, trying fallback",
                model_backend,
                model_path,
            )

    raise RuntimeError("Unable to initialize any detection runtime") from last_error
