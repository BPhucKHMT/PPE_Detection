from __future__ import annotations

import math

import cv2

from backend.app.core.config import ACTIVE_CLASSES, DETECTION_COLORS, FALLBACK_DETECTION_COLOR
from backend.model_runtime import Detection


def calculate_realtime_delay(video_timestamp_ms: int, stream_started_at: float, now: float) -> float:
    target_elapsed = max(video_timestamp_ms, 0) / 1000
    actual_elapsed = max(now - stream_started_at, 0.0)
    return max(target_elapsed - actual_elapsed, 0.0)


def normalize_video_fps(raw_fps: float, fallback_fps: float = 30.0) -> float:
    if not math.isfinite(raw_fps) or raw_fps <= 0:
        return fallback_fps
    return raw_fps


def calculate_frame_timestamp_ms(frame_index: int, source_fps: float) -> int:
    fps = normalize_video_fps(source_fps)
    return int(round((max(frame_index, 1) / fps) * 1000))


def filter_detections_by_active_classes(detections: list[Detection]) -> tuple[list[Detection], int, int]:
    filtered = [detection for detection in detections if detection.class_name in ACTIVE_CLASSES]
    return filtered, len(detections), len(filtered)


def get_detection_color(class_name: str) -> tuple[int, int, int]:
    return DETECTION_COLORS.get(class_name, FALLBACK_DETECTION_COLOR)


def annotate_frame(frame, detections: list[Detection]):
    annotated = frame.copy()
    for detection in detections:
        x1, y1, x2, y2 = [int(round(value)) for value in detection.bbox_xyxy]
        x1 = max(0, min(x1, annotated.shape[1] - 1))
        x2 = max(0, min(x2, annotated.shape[1] - 1))
        y1 = max(0, min(y1, annotated.shape[0] - 1))
        y2 = max(0, min(y2, annotated.shape[0] - 1))
        label = f"{detection.class_name} {detection.confidence:.2f}"
        color = get_detection_color(detection.class_name)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label_size, baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        label_y = max(label_size[1] + baseline + 4, y1 - 6)
        cv2.rectangle(
            annotated,
            (x1, label_y - label_size[1] - baseline - 4),
            (min(x1 + label_size[0] + 6, annotated.shape[1] - 1), label_y + baseline),
            (20, 20, 20),
            -1,
        )
        cv2.putText(
            annotated,
            label,
            (x1 + 3, label_y - 3),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA,
        )
    return annotated


def _track_color(track: dict) -> tuple[int, int, int]:
    state = track.get("violation", {}).get("state", "NORMAL")
    if state == "CONFIRMED_VIOLATION":
        return (40, 60, 255)
    if state == "SUSPECTED_VIOLATION":
        return (0, 200, 255)
    return (80, 220, 80)


def annotate_tracking_overlay(frame, tracks: list[dict]):
    annotated = frame.copy()
    for track in tracks:
        x1, y1, x2, y2 = [int(round(value)) for value in track.get("bbox_xyxy", [0, 0, 0, 0])]
        x1 = max(0, min(x1, annotated.shape[1] - 1))
        x2 = max(0, min(x2, annotated.shape[1] - 1))
        y1 = max(0, min(y1, annotated.shape[0] - 1))
        y2 = max(0, min(y2, annotated.shape[0] - 1))

        color = _track_color(track)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        violation = track.get("violation", {})
        state = violation.get("state", "NORMAL")

        if state == "CONFIRMED_VIOLATION":
            status_text = "VIOLATION"
        elif state == "SUSPECTED_VIOLATION":
            status_text = "WARN"
        else:
            status_text = "OK"

        label = f"#{track.get('track_id', '?')} {status_text}"

        label_size, baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
        label_y = max(label_size[1] + baseline + 3, y1 - 5)
        cv2.rectangle(
            annotated,
            (x1, label_y - label_size[1] - baseline - 3),
            (min(x1 + label_size[0] + 5, annotated.shape[1] - 1), label_y + baseline),
            (20, 20, 20),
            -1,
        )
        cv2.putText(
            annotated,
            label,
            (x1 + 2, label_y - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.38,
            color,
            1,
            cv2.LINE_AA,
        )

    return annotated
