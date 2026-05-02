from dataclasses import dataclass

import cv2


@dataclass(frozen=True)
class VideoOptimizationConfig:
    max_width: int = 640
    frame_skip: int = 3
    target_fps: int = 15


def resize_frame(frame, max_width=640):
    """Resize a frame to max_width while preserving aspect ratio."""
    height, width = frame.shape[:2]
    if width <= max_width:
        return frame

    scale = max_width / width
    resized_height = int(height * scale)
    return cv2.resize(frame, (max_width, resized_height))


def should_process_frame(frame_index, config):
    """Return True when a frame should be sent to inference."""
    frame_skip = max(1, int(config.frame_skip))
    return frame_index % frame_skip == 0


def should_render_frame(now, last_render_time, config):
    """Return True when enough time passed to render the next frame."""
    target_fps = max(1, int(config.target_fps))
    return now - last_render_time >= 1.0 / target_fps
