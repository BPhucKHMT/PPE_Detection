from __future__ import annotations

import argparse
import statistics
import sys
import time
from pathlib import Path

import cv2
import torch

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.rfdetr_runtime import RFDETRNativeRuntime, RFDETRONNXRuntime, RFDETRTensorRTRuntime

DEFAULT_VIDEO = Path("backend/data/video_test/ppe personal protection equipment dataset for object detection_720p.mp4")
DEFAULT_CHECKPOINT = Path("backend/models/checkpoint_best_total.pth")
DEFAULT_ONNX = Path("backend/models/rfdetr_medium.onnx")
DEFAULT_ENGINE = Path("backend/models/rfdetr_medium_fp32.engine")


def create_runtime(name: str):
    if name == "tensorrt":
        return RFDETRTensorRTRuntime(DEFAULT_ENGINE)
    if name == "onnx":
        return RFDETRONNXRuntime(DEFAULT_ONNX)
    if name == "native":
        return RFDETRNativeRuntime(DEFAULT_CHECKPOINT)
    raise ValueError(f"Unsupported runtime: {name}")


def load_frames(video_path: Path, limit: int) -> list:
    cap = cv2.VideoCapture(str(video_path))
    frames = []
    try:
        while len(frames) < limit:
            ok, frame = cap.read()
            if not ok:
                break
            frames.append(frame)
    finally:
        cap.release()
    if not frames:
        raise RuntimeError(f"No frames loaded from {video_path}")
    return frames


def benchmark_runtime(runtime_name: str, frames: list, repeats: int, conf: float) -> dict[str, float | int | str]:
    runtime = create_runtime(runtime_name)
    runtime.predict(frames[0], conf=conf)
    if torch.cuda.is_available():
        torch.cuda.synchronize()

    latencies_ms = []
    detection_count = 0
    for _ in range(repeats):
        for frame in frames:
            started_at = time.perf_counter()
            detections = runtime.predict(frame, conf=conf)
            if torch.cuda.is_available():
                torch.cuda.synchronize()
            latencies_ms.append((time.perf_counter() - started_at) * 1000)
            detection_count += len(detections)

    return {
        "runtime": runtime_name,
        "frames": len(latencies_ms),
        "avg_ms": statistics.mean(latencies_ms),
        "median_ms": statistics.median(latencies_ms),
        "fps": 1000.0 / statistics.mean(latencies_ms),
        "detections": detection_count,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark RF-DETR runtimes.")
    parser.add_argument("--video", type=Path, default=DEFAULT_VIDEO)
    parser.add_argument("--frames", type=int, default=20)
    parser.add_argument("--repeats", type=int, default=1)
    parser.add_argument("--conf", type=float, default=0.5)
    parser.add_argument("--runtime", choices=["native", "onnx", "tensorrt"], action="append")
    args = parser.parse_args()

    frames = load_frames(args.video, args.frames)
    runtime_names = args.runtime or ["onnx", "tensorrt"]
    for runtime_name in runtime_names:
        result = benchmark_runtime(runtime_name, frames, args.repeats, args.conf)
        print(
            f"{result['runtime']}: {result['fps']:.2f} FPS, "
            f"avg {result['avg_ms']:.2f} ms, median {result['median_ms']:.2f} ms, "
            f"detections {result['detections']}"
        )


if __name__ == "__main__":
    main()
