from __future__ import annotations

import asyncio
import base64
import logging
import os
import tempfile
import time

import cv2
from fastapi import APIRouter, File, UploadFile, WebSocket, WebSocketDisconnect

from backend.app.core.config import (
    ALERT_COOLDOWN_MS,
    ALERT_ESCALATION_MS,
    ALERT_MIN_TRACK_AGE,
    ALERT_MIN_TRACK_HITS,
    ALERT_VIOLATION_THRESHOLD_MS,
    CONFIDENCE_THRESHOLD,
    STREAM_CONFIG,
    TRACKING_MAX_AGE,
    TRACKING_MAX_IOU_DISTANCE,
    TRACKING_N_INIT,
)
from backend.app.services.alert_engine import AlertEngine
from backend.app.services.frame_processing import (
    annotate_frame,
    annotate_tracking_overlay,
    calculate_frame_timestamp_ms,
    calculate_realtime_delay,
    filter_detections_by_active_classes,
    normalize_video_fps,
)
from backend.app.services.job_store import job_store
from backend.app.services.ppe_association import associate_ppe_with_tracks
from backend.app.services.runtime_selector import get_detection_runtime
from backend.app.services.tracking_service import TrackingService
from backend.model_runtime import detections_to_payload
from video_optimization import resize_frame, should_process_frame

router = APIRouter()
logger = logging.getLogger(__name__)


def build_stream_frame_payload(
    *,
    frame_b64: str,
    processed_frames: int,
    frame_index: int,
    timestamp_ms: int,
    source_fps: float,
    output_fps: float,
    boxes_before_filter: int,
    boxes_after_filter: int,
    detections: list[dict],
    tracks: list[dict],
    alerts: list[dict],
) -> dict:
    return {
        "type": "frame",
        "frame": frame_b64,
        "processed_frames": processed_frames,
        "frame_index": frame_index,
        "timestamp_ms": timestamp_ms,
        "source_fps": source_fps,
        "output_fps": output_fps,
        "boxes_before_filter": boxes_before_filter,
        "boxes_after_filter": boxes_after_filter,
        "detections": detections,
        "tracks": tracks,
        "alerts": alerts,
    }


@router.post("/detect/upload")
async def upload_video(file: UploadFile = File(...)) -> dict[str, str]:
    suffix = os.path.splitext(file.filename or "upload.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        video_path = temp_file.name

    job_id = job_store.create(video_path)
    return {"job_id": job_id}


@router.websocket("/detect/stream/{job_id}")
async def detect_stream(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    job = job_store.get(job_id)
    if job is None:
        logger.warning("[ws] invalid job_id=%s", job_id)
        await websocket.send_json({"type": "error", "message": "Invalid job_id"})
        await websocket.close()
        return

    logger.info("[ws] stream start job_id=%s path=%s", job_id, job.video_path)

    cap = cv2.VideoCapture(job.video_path)
    frame_index = 0
    processed_frames = 0
    source_fps = normalize_video_fps(float(cap.get(cv2.CAP_PROP_FPS) or 0.0))
    output_fps = source_fps / max(1, int(STREAM_CONFIG.frame_skip))
    stream_started_at = time.perf_counter()

    tracking_service = TrackingService(
        max_age=TRACKING_MAX_AGE,
        n_init=TRACKING_N_INIT,
        max_iou_distance=TRACKING_MAX_IOU_DISTANCE,
    )
    alert_engine = AlertEngine(
        violation_threshold_ms=ALERT_VIOLATION_THRESHOLD_MS,
        cooldown_ms=ALERT_COOLDOWN_MS,
        escalation_ms=ALERT_ESCALATION_MS,
        min_track_age=ALERT_MIN_TRACK_AGE,
        min_track_hits=ALERT_MIN_TRACK_HITS,
    )

    try:
        while cap.isOpened():
            if job.cancel:
                await websocket.send_json({"type": "done", "reason": "cancelled"})
                break

            ret, frame = cap.read()
            if not ret:
                logger.info("[ws] completed job_id=%s processed_frames=%s", job_id, processed_frames)
                await websocket.send_json({"type": "done", "reason": "completed"})
                break

            frame_index += 1
            if not should_process_frame(frame_index, STREAM_CONFIG):
                continue

            frame = resize_frame(frame, max_width=STREAM_CONFIG.max_width)
            detections = get_detection_runtime().predict(frame, conf=CONFIDENCE_THRESHOLD)
            detections, boxes_before, boxes_after = filter_detections_by_active_classes(detections)

            tracks = tracking_service.update_tracks(detections=detections, frame=frame)
            tracks = associate_ppe_with_tracks(tracks=tracks, detections=detections)

            timestamp_ms = calculate_frame_timestamp_ms(frame_index, source_fps)
            tracks, alerts = alert_engine.evaluate_tracks(tracks, timestamp_ms=timestamp_ms)

            detection_payload = detections_to_payload(detections)
            annotated = annotate_frame(frame, detections)
            annotated = annotate_tracking_overlay(annotated, tracks)

            logger.debug(
                "[ws] frame job_id=%s frame_index=%s processed_frames=%s detections=%s tracks=%s alerts=%s",
                job_id,
                frame_index,
                processed_frames + 1,
                len(detection_payload),
                len(tracks),
                len(alerts),
            )

            ok, buffer = cv2.imencode(
                ".jpg",
                annotated,
                [int(cv2.IMWRITE_JPEG_QUALITY), 68],
            )
            if not ok:
                continue

            processed_frames += 1
            delay = calculate_realtime_delay(timestamp_ms, stream_started_at, time.perf_counter())
            if delay > 0:
                await asyncio.sleep(delay)

            frame_b64 = base64.b64encode(buffer.tobytes()).decode("utf-8")
            await websocket.send_json(
                build_stream_frame_payload(
                    frame_b64=frame_b64,
                    processed_frames=processed_frames,
                    frame_index=frame_index,
                    timestamp_ms=timestamp_ms,
                    source_fps=source_fps,
                    output_fps=output_fps,
                    boxes_before_filter=boxes_before,
                    boxes_after_filter=boxes_after,
                    detections=detection_payload,
                    tracks=tracks,
                    alerts=alerts,
                )
            )
            await asyncio.sleep(0)

    except WebSocketDisconnect:
        logger.warning("[ws] disconnected job_id=%s", job_id)
        job_store.cancel(job_id)
    finally:
        logger.info("[ws] cleanup job_id=%s", job_id)
        cap.release()
        existing = job_store.pop(job_id)
        if existing and os.path.exists(existing.video_path):
            try:
                os.remove(existing.video_path)
            except OSError:
                pass
