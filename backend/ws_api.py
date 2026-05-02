from __future__ import annotations

from backend.app.main import app
from backend.app.services.frame_processing import (
    calculate_frame_timestamp_ms,
    calculate_realtime_delay,
    get_detection_color,
    normalize_video_fps,
)
from backend.app.services.runtime_selector import choose_rfdetr_runtime_model, get_runtime_info

__all__ = [
    "app",
    "calculate_frame_timestamp_ms",
    "calculate_realtime_delay",
    "choose_rfdetr_runtime_model",
    "get_detection_color",
    "get_runtime_info",
    "normalize_video_fps",
]
