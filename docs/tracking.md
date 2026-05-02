# DeepSORT Tracking + Alert Rule Plan

## Goal
Áp dụng DeepSORT vào pipeline detect hiện tại để gắn `track_id` ổn định theo từng người, sau đó xây rule cảnh báo theo thời gian để giảm alert nhiễu và tăng độ tin cậy cho người dùng.

## Scope
- Backend stream (`/detect/stream/{job_id}`): thêm tracking layer sau detection.
- Payload WebSocket: mở rộng schema để gửi `track_id`, trạng thái vi phạm, alert event.
- Alert Engine: rule theo thời gian/cửa sổ frame, cooldown, anti-flicker.
- Frontend: hiển thị ID tracking + danh sách alert realtime.

## Assumptions (để bắt đầu nhanh)
- Đối tượng cần track chính: `person`.
- PPE classes dùng để check violation: `helmet`, `safety-vest`, `gloves`, `shoes`.
- 1 track tương ứng 1 người tại 1 thời điểm.
- Alert chỉ bắn khi vi phạm duy trì qua ngưỡng thời gian.

---

## Architecture Draft

### 1) Detection → Tracking
1. RF-DETR trả bounding boxes cho `person` (+ optional PPE boxes).
2. Convert person detections sang format DeepSORT (`xyxy`, confidence, class).
3. DeepSORT update mỗi frame, trả danh sách track active:
   - `track_id`
   - bbox hiện tại
   - age/hit/miss metadata

### 2) Track-level PPE Association
- Với mỗi `track_id`, map PPE items gần nhất theo IoU hoặc center-distance:
  - helmet ↔ vùng head
  - vest ↔ torso
  - gloves ↔ hand region (nới tolerance)
  - shoes ↔ foot region
- Kết quả: trạng thái PPE theo từng track tại frame hiện tại.

### 3) Violation State Machine
Mỗi `track_id` có state riêng:
- `NORMAL`
- `SUSPECTED_VIOLATION`
- `CONFIRMED_VIOLATION`
- `COOLDOWN`

Chuyển trạng thái dựa trên số frame/thời gian liên tục vi phạm.

---

## Data Contract Changes

### WebSocket `frame` payload (append fields, không phá vỡ fields cũ)
```json
{
  "type": "frame",
  "frame_index": 123,
  "timestamp_ms": 4567,
  "tracks": [
    {
      "track_id": 17,
      "bbox_xyxy": [100, 50, 220, 410],
      "ppe_status": {
        "helmet": false,
        "safety_vest": true,
        "gloves": true,
        "shoes": false
      },
      "violation": {
        "is_violating": true,
        "missing_items": ["helmet", "shoes"],
        "duration_ms": 2100,
        "state": "CONFIRMED_VIOLATION"
      }
    }
  ],
  "alerts": [
    {
      "alert_id": "a-uuid",
      "track_id": 17,
      "severity": "high",
      "code": "PPE_MISSING_PERSISTENT",
      "message": "Track #17 thiếu helmet và shoes > 2s",
      "started_at_ms": 2400,
      "current_duration_ms": 2100
    }
  ]
}
```

---

## Alert Rules (đề xuất khởi tạo)

### Rule R1: Persistent Missing PPE
- **Condition:** 1 hoặc nhiều PPE required bị thiếu liên tục.
- **Threshold:** `violation_duration_ms >= 2000`.
- **Action:** emit alert level `high`.
- **Cooldown:** 5000 ms cho cùng `track_id` + cùng `missing_items` signature.

### Rule R2: Track Stability Gate
- **Condition:** track mới xuất hiện nhưng chưa ổn định.
- **Threshold:** chỉ evaluate violation khi `track_age >= 8 frames` và `hits >= 3`.
- **Action:** suppress alert trong warm-up.

### Rule R3: Anti-Flicker Recovery
- **Condition:** PPE xuất hiện lại ngắn hạn < 500 ms rồi mất tiếp.
- **Action:** không reset violation counter ngay, dùng hysteresis window.

### Rule R4: Lost Track Handling
- **Condition:** track biến mất (`missed > max_age`).
- **Action:** đóng alert active của track đó với reason `track_lost`.

### Rule R5: Escalation
- **Condition:** `CONFIRMED_VIOLATION` kéo dài > 10s.
- **Action:** tăng severity `critical`, push UI sticky alert.

### Rule R6: Helmet Present But Not Worn
- **Condition:** detect có helmet gần person nhưng helmet không nằm trong `head ROI` của cùng `track_id` (ví dụ đội mũ trên tay/hông).
- **Threshold:** trạng thái `helmet_present && !helmet_worn` kéo dài `>= 1500-2000 ms`.
- **Action:** emit alert `HELMET_NOT_WORN` level `high`.
- **Cooldown:** 5000 ms cho cùng `track_id` để tránh spam.

---

## Backend Implementation Plan

- [ ] **Task 1: Add tracker dependencies**  
  Verify: DeepSORT package import OK trong môi trường backend.

- [ ] **Task 2: Create tracking service module** (`backend/app/services/tracking_service.py`)  
  Verify: có API `update_tracks(person_detections, frame)` trả list tracks chuẩn.

- [ ] **Task 3: Add PPE association module** (`backend/app/services/ppe_association.py`)  
  Verify: mỗi track trả `ppe_status` deterministic với test fixtures và có cờ `helmet_worn` tách biệt với `helmet_present`.

- [ ] **Task 4: Add alert engine module** (`backend/app/services/alert_engine.py`)  
  Verify: state machine chạy đúng theo R1-R6 bằng unit tests.

- [ ] **Task 5: Integrate into `ws_routes.py` stream loop**  
  Verify: payload có `tracks` + `alerts`, fields cũ vẫn giữ.

- [ ] **Task 6: Add config knobs** (`backend/app/core/config.py`)  
  Verify: thresholds/cooldown đọc từ config constant/env.

- [ ] **Task 7: Add tests** (`backend/tests/test_tracking_alerts.py`)  
  Verify: pass cases cho warm-up, persistent violation, cooldown, track lost, và case `helmet_on_hand` -> `HELMET_NOT_WORN`.

---

## Frontend Implementation Plan

- [ ] Render `track_id` trên bbox label (`person #17`).
- [ ] Thêm panel alert realtime (severity color + duration).
- [ ] Group alert theo `track_id`, tránh duplicate spam.
- [ ] UX rule: alert active luôn pin trên top, resolved chuyển history.

Verify: upload video demo thấy ID ổn định và alert không nhấp nháy.

---

## KPI & Acceptance Criteria

### KPI kỹ thuật
- ID switch rate giảm qua các đoạn occlusion nhẹ.
- False alert rate giảm tối thiểu 30% so với logic frame-by-frame.
- Không giảm FPS trung bình quá 15% so với baseline hiện tại.

### Done when
- [ ] `/detect/stream` trả được `track_id` cho person ổn định.
- [ ] Alert chỉ bắn khi vi phạm kéo dài qua threshold.
- [ ] Có cooldown chống spam cho cùng vi phạm.
- [ ] UI hiển thị track + alert rõ ràng cho người dùng.
- [ ] Test backend cho tracking/alert pass.

---

## Rollout Strategy
1. **Phase A (Shadow mode):** chạy tracker + alert engine nhưng chỉ log, chưa hiển thị.
2. **Phase B (Soft launch):** bật UI alert cho nội bộ, đo false positive/negative.
3. **Phase C (Production):** bật full, theo dõi KPI 1-2 tuần, tinh chỉnh threshold.

## Risks
- Occlusion dày gây ID switch → cần tune DeepSORT params (`max_age`, `n_init`, `max_iou_distance`).
- Association PPE sai khi crowd đông → cần spatial constraints mạnh hơn.
- TensorRT + tracking tăng latency → cần benchmark theo độ phân giải/frame_skip.
