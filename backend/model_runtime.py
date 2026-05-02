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
