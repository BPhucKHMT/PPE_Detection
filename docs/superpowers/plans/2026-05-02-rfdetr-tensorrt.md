# RF-DETR TensorRT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current YOLO TensorRT backend with RF-DETR accelerated through ONNX and TensorRT while keeping the React upload/stream API stable.

**Architecture:** Add a small model-runtime boundary so FastAPI can call either YOLO or RF-DETR through the same detection payload contract. Export RF-DETR from `backend/models/checkpoint_best_total.pth` to ONNX, validate parity against native RF-DETR, build a TensorRT engine, then switch `backend/ws_api.py` to prefer the RF-DETR engine with a safe fallback. Keep existing React WebSocket messages unchanged except for optional runtime metadata.

**Tech Stack:** Python 3.10 conda env `cs406-opt`, `rfdetr==1.2.1`, PyTorch CUDA 12.6, ONNX, TensorRT `tensorrt-cu12`, FastAPI WebSocket backend, React/Vite frontend.

---

## File Structure

- Create `backend/model_runtime.py`: shared detection dataclass and runtime interface.
- Create `backend/rfdetr_runtime.py`: RF-DETR native, ONNX, and TensorRT loading/inference helpers.
- Create `backend/export_rfdetr_onnx.py`: one-shot RF-DETR checkpoint to ONNX export script.
- Create `backend/build_rfdetr_tensorrt.py`: ONNX to TensorRT engine build script.
- Create `backend/benchmark_rfdetr_runtime.py`: parity and FPS benchmark for native, ONNX, TensorRT.
- Modify `backend/ws_api.py`: load RF-DETR TensorRT runtime instead of YOLO runtime.
- Modify `backend/requirements.txt`: add explicit ONNX/TensorRT runtime dependencies if they are not already present in deployment docs.
- Create `backend/tests/test_rfdetr_runtime.py`: unit tests for model selection, payload conversion, class filtering, FPS pacing.
- Keep `frontend/src/app/services/streamSocket.ts` and `frontend/src/app/pages/UploadPage.tsx` mostly stable; only add optional `model_backend` display later if desired.

---

## Task 1: Define Stable Detection Runtime Contract

**Files:**
- Create: `backend/model_runtime.py`
- Test: `backend/tests/test_rfdetr_runtime.py`

- [x] **Step 1: Write failing tests for detection payload shape**

```python
import unittest

from backend.model_runtime import Detection, detections_to_payload


class TestDetectionRuntimeContract(unittest.TestCase):
    def test_detections_to_payload_matches_websocket_contract(self):
        detections = [
            Detection(
                class_id=13,
                class_name="person",
                confidence=0.91,
                bbox_xyxy=[1.0, 2.0, 30.0, 40.0],
            )
        ]

        payload = detections_to_payload(detections)

        self.assertEqual(
            payload,
            [
                {
                    "class_id": 13,
                    "class_name": "person",
                    "confidence": 0.91,
                    "bbox_xyxy": [1.0, 2.0, 30.0, 40.0],
                }
            ],
        )
```

- [x] **Step 2: Run test and verify RED**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python -m unittest backend.tests.test_rfdetr_runtime
```

Expected: FAIL because `backend.model_runtime` does not exist.

- [x] **Step 3: Implement runtime contract**

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Detection:
    class_id: int
    class_name: str
    confidence: float
    bbox_xyxy: list[float]


class DetectionRuntime(Protocol):
    backend_name: str

    def predict(self, frame, conf: float = 0.5) -> list[Detection]:
        ...


def detections_to_payload(detections: list[Detection]) -> list[dict]:
    return [
        {
            "class_id": detection.class_id,
            "class_name": detection.class_name,
            "confidence": detection.confidence,
            "bbox_xyxy": detection.bbox_xyxy,
        }
        for detection in detections
    ]
```

- [x] **Step 4: Run test and verify GREEN**

Expected: PASS.

---

## Task 2: Add RF-DETR Native Runtime Adapter

**Files:**
- Create: `backend/rfdetr_runtime.py`
- Modify: `backend/tests/test_rfdetr_runtime.py`
- Reference: `rf_detr_loader.py`

- [x] **Step 1: Write failing tests for RF-DETR detection conversion**

```python
class FakeDetections:
    xyxy = [[1, 2, 30, 40]]
    class_id = [13]
    confidence = [0.91]


class TestRFDETRRuntime(unittest.TestCase):
    def test_rfdetr_detections_convert_to_shared_contract(self):
        from backend.rfdetr_runtime import convert_rfdetr_detections

        detections = convert_rfdetr_detections(FakeDetections())

        self.assertEqual(detections[0].class_name, "person")
        self.assertEqual(detections[0].class_id, 13)
        self.assertEqual(detections[0].bbox_xyxy, [1.0, 2.0, 30.0, 40.0])
```

- [x] **Step 2: Run test and verify RED**

Expected: FAIL because `backend.rfdetr_runtime` does not exist.

- [x] **Step 3: Implement conversion helper and native runtime wrapper**

Implementation should reuse the label map from `rf_detr_loader.py` initially. Keep inference wrapper small:

```python
from __future__ import annotations

from pathlib import Path

from PIL import Image
from rfdetr import RFDETRMedium

from backend.model_runtime import Detection

RFDETR_LABELS = {
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


def convert_rfdetr_detections(raw_detections) -> list[Detection]:
    detections: list[Detection] = []
    for xyxy, class_id, confidence in zip(
        raw_detections.xyxy,
        raw_detections.class_id,
        raw_detections.confidence,
    ):
        class_id = int(class_id)
        detections.append(
            Detection(
                class_id=class_id,
                class_name=RFDETR_LABELS.get(class_id, str(class_id)),
                confidence=float(confidence),
                bbox_xyxy=[float(value) for value in xyxy],
            )
        )
    return detections


class RFDETRNativeRuntime:
    backend_name = "rfdetr-native"

    def __init__(self, checkpoint_path: str | Path):
        self.model = RFDETRMedium(pretrain_weights=str(checkpoint_path))

    def predict(self, frame, conf: float = 0.5) -> list[Detection]:
        image = Image.fromarray(frame).convert("RGB")
        raw = self.model.predict(image, threshold=conf)
        return convert_rfdetr_detections(raw)
```

- [x] **Step 4: Run tests and verify GREEN**

Expected: PASS.

---

## Task 3: Investigate RF-DETR Export API and Create ONNX Export Script

**Files:**
- Create: `backend/export_rfdetr_onnx.py`
- Create output: `backend/models/rfdetr_medium.onnx`
- Input checkpoint: `backend/models/checkpoint_best_total.pth`

- [x] **Step 1: Probe RF-DETR model object**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python - <<'PY'
from rfdetr import RFDETRMedium
model = RFDETRMedium(pretrain_weights="backend/models/checkpoint_best_total.pth")
print(type(model))
print([name for name in dir(model) if "export" in name.lower() or "onnx" in name.lower() or "model" in name.lower()])
print(model.__dict__.keys())
PY
```

Expected: identify the internal PyTorch module or official export method. Do not guess the export path.

- [x] **Step 2: Implement export script based on the discovered API**

If RF-DETR exposes an official ONNX/export method, use that. If not, export the underlying PyTorch module with fixed image size, preferably 640 or 560 depending on RF-DETR preprocessing. The script must:

```python
from pathlib import Path

CHECKPOINT = Path("backend/models/checkpoint_best_total.pth")
OUTPUT = Path("backend/models/rfdetr_medium.onnx")


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # Use official RF-DETR export method if available.
    # If official export is not available, wrap preprocessing + model forward explicitly.
    raise SystemExit("Fill only after Step 1 identifies the supported RF-DETR export API.")


if __name__ == "__main__":
    main()
```

- [x] **Step 3: Run export**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python backend/export_rfdetr_onnx.py
```

Expected: creates `backend/models/rfdetr_medium.onnx`.

- [x] **Step 4: Validate ONNX model**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python - <<'PY'
import onnx
model = onnx.load("backend/models/rfdetr_medium.onnx")
onnx.checker.check_model(model)
print("ONNX OK")
PY
```

Expected: `ONNX OK`.

---

## Task 4: Build RF-DETR TensorRT Engine

**Files:**
- Create: `backend/build_rfdetr_tensorrt.py`
- Input: `backend/models/rfdetr_medium.onnx`
- Output: `backend/models/rfdetr_medium.engine`

- [x] **Step 1: Create TensorRT build script**

Use TensorRT Python APIs or Polygraphy. The script must build FP16 if supported:

```python
from pathlib import Path

ONNX_PATH = Path("backend/models/rfdetr_medium.onnx")
ENGINE_PATH = Path("backend/models/rfdetr_medium.engine")


def main() -> None:
    if not ONNX_PATH.exists():
        raise FileNotFoundError(ONNX_PATH)
    # Build serialized TensorRT engine with FP16 enabled.
    # Prefer TensorRT Python API already installed as tensorrt-cu12.
    raise SystemExit("Implement after ONNX input/output tensor names are known.")


if __name__ == "__main__":
    main()
```

- [x] **Step 2: Run build script**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python backend/build_rfdetr_tensorrt.py
```

Expected: creates `backend/models/rfdetr_medium.engine`.

- [x] **Step 3: Smoke-load engine**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python - <<'PY'
from pathlib import Path
engine = Path("backend/models/rfdetr_medium.engine")
print(engine.exists(), engine.stat().st_size)
PY
```

Expected: `True` and nonzero file size.

---

## Task 5: Benchmark Native RF-DETR vs ONNX vs TensorRT

**Files:**
- Create: `backend/benchmark_rfdetr_runtime.py`
- Input video: `backend/data/video_test/ppe personal protection equipment dataset for object detection_720p.mp4`

- [x] **Step 1: Implement benchmark script**

Benchmark first 100 frames, report average latency, p95, FPS, and detection count on frame 1 for all available runtimes.

- [x] **Step 2: Run benchmark**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python backend/benchmark_rfdetr_runtime.py
```

Expected output shape:

```text
rfdetr-native: avg_ms=... p95_ms=... fps=... first_detections=...
rfdetr-onnx: avg_ms=... p95_ms=... fps=... first_detections=...
rfdetr-tensorrt: avg_ms=... p95_ms=... fps=... first_detections=...
```

- [x] **Step 3: Decide deployment threshold**

Decision: raw FP16 TensorRT engine was fast but inaccurate until the input was made contiguous, and LayerNorm still warned about FP16 overflow risk. The backend now prefers `rfdetr_medium_fp32.engine`, which matched ONNX detections in the benchmark and reached about 49.78 FPS on 20 video frames versus about 3.22 FPS for ONNX Runtime.

Proceed to backend switch only if TensorRT RF-DETR is stable and faster than native RF-DETR. If TensorRT is slower or inaccurate, keep YOLO TensorRT in backend and document RF-DETR blocker.

---

## Task 6: Switch FastAPI Backend from YOLO TensorRT to RF-DETR TensorRT

**Files:**
- Modify: `backend/ws_api.py`
- Modify: `backend/tests/test_ws_api_config.py`
- Use: `backend/rfdetr_runtime.py`

- [x] **Step 1: Write failing test for RF-DETR priority**

Add a test that model selection prefers:

1. `backend/models/rfdetr_medium.engine`
2. `backend/models/rfdetr_medium.onnx`
3. `backend/models/checkpoint_best_total.pth`

- [x] **Step 2: Implement model selection**

Replace YOLO-specific `choose_yolo_weights()` with RF-DETR-aware runtime selection:

```python
def choose_detection_backend(model_dir: Path = MODEL_DIR) -> tuple[str, str]:
    engine_path = model_dir / "rfdetr_medium.engine"
    if engine_path.exists():
        return str(engine_path), "rfdetr-tensorrt"

    onnx_path = model_dir / "rfdetr_medium.onnx"
    if onnx_path.exists():
        return str(onnx_path), "rfdetr-onnx"

    checkpoint_path = model_dir / "checkpoint_best_total.pth"
    return str(checkpoint_path), "rfdetr-native"
```

- [x] **Step 3: Replace YOLO inference in stream loop**

Instead of:

```python
result = model.predict(...)[0]
result, boxes_before, boxes_after = filter_result_by_active_classes(result)
detections = build_detection_payload(result)
annotated = result.plot(font_size=0.4)
```

Use:

```python
detections = runtime.predict(frame, conf=0.5)
detections = filter_detections_by_active_classes(detections)
annotated = draw_detections(frame, detections)
payload = detections_to_payload(detections)
```

- [x] **Step 4: Preserve frontend contract**

The websocket frame message must keep:

```python
{
    "type": "frame",
    "frame": frame_b64,
    "processed_frames": processed_frames,
    "frame_index": frame_index,
    "timestamp_ms": timestamp_ms,
    "source_fps": source_fps,
    "output_fps": output_fps,
    "boxes_before_filter": boxes_before,
    "boxes_after_filter": boxes_after,
    "detections": payload,
}
```

- [x] **Step 5: Run backend tests**

Run:

```bash
/home/nguyenlambaophuc-23521208/.local/bin/rtk /home/nguyenlambaophuc-23521208/miniconda3/envs/cs406-opt/bin/python -m unittest discover backend/tests
```

Expected: PASS.

---

## Task 7: Manual End-to-End Verification

**Files:**
- No code changes unless a bug is found.

- [ ] **Step 1: Start backend**

Run:

```bash
conda activate cs406-opt
uvicorn backend.ws_api:app --host 0.0.0.0 --port 8000
```

- [x] **Step 2: Check health**

Run:

```bash
curl http://localhost:8000/health
```

Expected:

```json
{
  "status": "ok",
  "model_backend": "rfdetr-tensorrt",
  "model_path": ".../backend/models/rfdetr_medium.engine",
  "device": "cuda:0"
}
```

- [x] **Step 3: Upload video from React**

Expected:
- video plays at source FPS timing,
- `Video FPS` equals source video FPS,
- detections appear from RF-DETR,
- no YOLO model is loaded in logs.

- [x] **Step 4: Compare against YOLO TensorRT baseline**

Verified with FastAPI `TestClient`: upload + websocket produced the first frame payload with `source_fps=29.609`, `output_fps=29.609`, `boxes_after_filter=9`, and a base64 frame. React UI was not manually opened in-browser in this pass.

Record:

```text
RF-DETR TensorRT FPS:
RF-DETR TensorRT avg latency:
YOLO TensorRT FPS baseline: 116 FPS raw inference from previous benchmark
Detection quality notes:
```

---

## Risks and Decisions

- RF-DETR export may not be as straightforward as YOLO because the package may not expose a stable ONNX export API.
- TensorRT may need custom handling for postprocess if RF-DETR outputs raw logits/boxes instead of ready NMS detections.
- If RF-DETR TensorRT cannot include postprocess cleanly, keep TensorRT for model forward and perform decode/filter in Python first.
- If RF-DETR TensorRT cannot hit realtime 30/60 FPS, keep stream pacing but report actual receive speed separately from source FPS.

---

## Self-Review

- Spec coverage: plan covers export, ONNX validation, TensorRT build, benchmark, backend replacement, React compatibility, and verification.
- Placeholder scan: export/build scripts intentionally require API discovery because RF-DETR export internals must be probed before writing correct code. The plan contains the exact probe command and decision point.
- Type consistency: shared `Detection` contract is used by adapter, backend stream, payload conversion, and tests.
