from pathlib import Path

from video_optimization import VideoOptimizationConfig

DEVICE = 0
DEVICE_LABEL = "cpu"

try:
    import torch

    if torch.cuda.is_available():
        DEVICE = 0
        DEVICE_LABEL = "cuda:0"
except Exception:
    DEVICE = 0
    DEVICE_LABEL = "cpu"

BACKEND_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BACKEND_DIR / "models"

ACTIVE_CLASSES = {
    "person",
    "helmet",
    "safety-vest",
    "gloves",
    "shoes",
}

DETECTION_COLORS = {
    "person": (255, 120, 40),
    "helmet": (80, 220, 80),
    "safety-vest": (0, 190, 255),
    "gloves": (220, 90, 220),
    "shoes": (255, 220, 40),
}

NMS_IOU_THRESHOLD = 0.5 # Ngưỡng IOU để track một object
CONFIDENCE_THRESHOLD = 0.5 # Ngưỡng tin cậy để phát hiện object

FALLBACK_DETECTION_COLOR = (160, 160, 160)
STREAM_CONFIG = VideoOptimizationConfig(max_width=512, frame_skip=1, target_fps=30)

TRACKING_HEAD_RATIO = 0.30 # Tỷ lệ đầu so với tổng chiều cao của object
TRACKING_MAX_AGE = 30 # Số frame tối đa để track một object
TRACKING_N_INIT = 3 # Số frame tối thiểu để track một object
TRACKING_MAX_IOU_DISTANCE = 0.7 # Khoảng cách IOU tối đa để track một object

ALERT_VIOLATION_THRESHOLD_MS = 1500 # Thời gian vi phạm liên tục để chuyển WARN -> VIOLATION
ALERT_COOLDOWN_MS = 3000 # Khoảng chờ tối thiểu giữa 2 lần phát cảnh báo cho cùng track
ALERT_ESCALATION_MS = 6000 # Nếu vi phạm kéo dài tới mốc này thì nâng mức cảnh báo lên CRITICAL
ALERT_MIN_TRACK_AGE = 5 # Track phải tồn tại ít nhất 10 frame mới được xét vi phạm/cảnh báo
ALERT_MIN_TRACK_HITS = 3 # Track phải được match thành công ít nhất 4 lần mới được coi là ổn định

ADAPTIVE_CROWD_THRESHOLD = 8 # Từ số người này trở lên thì kích hoạt chế độ crowd optimization
ADAPTIVE_FRAME_SKIP_WHEN_CROWD = 4 # Bỏ qua nhiều frame hơn để giữ FPS khi quá đông người
ADAPTIVE_MAX_WIDTH_WHEN_CROWD = 480 # Giảm resolution xử lý khi quá đông người để giảm tải inference/encode
STREAM_JPEG_QUALITY = 58 # Giảm chất lượng JPEG để giảm thời gian encode + payload websocket
