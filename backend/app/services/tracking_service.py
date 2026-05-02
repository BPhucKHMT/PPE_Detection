from __future__ import annotations

from typing import Any

from backend.model_runtime import Detection


class TrackingService:
    def __init__(
        self,
        tracker: Any | None = None,
        *,
        max_age: int = 30,
        n_init: int = 3,
        max_iou_distance: float = 0.7,
    ) -> None:
        self.tracker = tracker or self._create_default_tracker(
            max_age=max_age,
            n_init=n_init,
            max_iou_distance=max_iou_distance,
        )

    @staticmethod
    def _create_default_tracker(*, max_age: int, n_init: int, max_iou_distance: float):
        from deep_sort_realtime.deepsort_tracker import DeepSort

        return DeepSort(max_age=max_age, n_init=n_init, max_iou_distance=max_iou_distance)

    def update_tracks(self, detections: list[Detection], frame) -> list[dict[str, Any]]:
        person_detections = [detection for detection in detections if detection.class_name == "person"]
        tracker_inputs = [
            (
                [
                    float(detection.bbox_xyxy[0]),
                    float(detection.bbox_xyxy[1]),
                    float(detection.bbox_xyxy[2] - detection.bbox_xyxy[0]),
                    float(detection.bbox_xyxy[3] - detection.bbox_xyxy[1]),
                ],
                float(detection.confidence),
                detection.class_name,
            )
            for detection in person_detections
        ]

        raw_tracks = self.tracker.update_tracks(tracker_inputs, frame=frame)

        tracks: list[dict[str, Any]] = []
        for raw_track in raw_tracks:
            if hasattr(raw_track, "is_confirmed") and not raw_track.is_confirmed():
                continue

            x1, y1, x2, y2 = [float(value) for value in raw_track.to_ltrb()]
            tracks.append(
                {
                    "track_id": int(raw_track.track_id),
                    "bbox_xyxy": [x1, y1, x2, y2],
                    "hits": int(getattr(raw_track, "hits", 0)),
                    "age": int(getattr(raw_track, "age", 0)),
                    "missed": int(getattr(raw_track, "time_since_update", 0)),
                }
            )

        return tracks
