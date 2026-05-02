from __future__ import annotations

from backend.app.core.config import TRACKING_HEAD_RATIO
from backend.model_runtime import Detection

PPE_KEYS = {
    "helmet": "helmet_present",
    "safety-vest": "safety_vest",
    "gloves": "gloves",
    "shoes": "shoes",
}


def _bbox_center(bbox_xyxy: list[float]) -> tuple[float, float]:
    x1, y1, x2, y2 = bbox_xyxy
    return (x1 + x2) / 2.0, (y1 + y2) / 2.0


def _center_in_person(person_bbox: list[float], ppe_bbox: list[float], y_min_ratio: float, y_max_ratio: float) -> bool:
    px1, py1, px2, py2 = person_bbox
    cx, cy = _bbox_center(ppe_bbox)
    person_h = max(py2 - py1, 1.0)
    y_min = py1 + person_h * y_min_ratio
    y_max = py1 + person_h * y_max_ratio
    return px1 <= cx <= px2 and y_min <= cy <= y_max


def _is_helmet_worn(person_bbox: list[float], helmet_bbox: list[float], head_ratio: float) -> bool:
    return _center_in_person(person_bbox, helmet_bbox, 0.0, head_ratio)


def _is_vest_on_person(person_bbox: list[float], vest_bbox: list[float]) -> bool:
    return _center_in_person(person_bbox, vest_bbox, 0.20, 0.80)


def _is_shoes_on_person(person_bbox: list[float], shoes_bbox: list[float]) -> bool:
    return _center_in_person(person_bbox, shoes_bbox, 0.72, 1.05)


def _closest_track_index(tracks: list[dict], bbox_xyxy: list[float]) -> int | None:
    if not tracks:
        return None
    cx, cy = _bbox_center(bbox_xyxy)
    best_idx: int | None = None
    best_dist = float("inf")
    for idx, track in enumerate(tracks):
        tx, ty = _bbox_center(track["bbox_xyxy"])
        dist = (cx - tx) ** 2 + (cy - ty) ** 2
        if dist < best_dist:
            best_dist = dist
            best_idx = idx
    return best_idx


def associate_ppe_with_tracks(
    tracks: list[dict],
    detections: list[Detection],
    *,
    head_ratio: float = TRACKING_HEAD_RATIO,
) -> list[dict]:
    enriched_tracks: list[dict] = []
    for track in tracks:
        updated_track = dict(track)
        updated_track["ppe_status"] = {
            "helmet_present": False,
            "helmet_worn": False,
            "safety_vest": False,
            "gloves": False,
            "shoes": False,
        }
        enriched_tracks.append(updated_track)

    ppe_detections = [d for d in detections if d.class_name in PPE_KEYS]

    for detection in ppe_detections:
        track_idx = _closest_track_index(enriched_tracks, detection.bbox_xyxy)
        if track_idx is None:
            continue

        track = enriched_tracks[track_idx]
        person_bbox = track["bbox_xyxy"]
        class_name = detection.class_name

        if class_name == "helmet":
            if _center_in_person(person_bbox, detection.bbox_xyxy, 0.0, 0.45):
                track["ppe_status"]["helmet_present"] = True
                if _is_helmet_worn(person_bbox, detection.bbox_xyxy, head_ratio):
                    track["ppe_status"]["helmet_worn"] = True
        elif class_name == "safety-vest":
            if _is_vest_on_person(person_bbox, detection.bbox_xyxy):
                track["ppe_status"]["safety_vest"] = True
        elif class_name == "shoes":
            if _is_shoes_on_person(person_bbox, detection.bbox_xyxy):
                track["ppe_status"]["shoes"] = True
        elif class_name == "gloves":
            if _center_in_person(person_bbox, detection.bbox_xyxy, 0.35, 0.92):
                track["ppe_status"]["gloves"] = True

    return enriched_tracks

