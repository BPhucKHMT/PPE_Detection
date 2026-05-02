# System Issues & Production Improvement Plan

## 1. Nhận định tổng quan

Dự án hiện tại **có thể build/chạy demo được**, đặc biệt phù hợp cho báo cáo học thuật, so sánh mô hình và minh họa inference trên ảnh/video upload. Tuy nhiên nếu nhìn dưới góc độ **production-ready / real-time PPE detection system**, hệ thống còn khá nhiều điểm yếu.

Vấn đề lớn nhất đúng như nhận xét: phần **real-time video upload rất lag**. Nguyên nhân không chỉ nằm ở model nặng, mà còn do kiến trúc hiện tại xử lý video theo kiểu tuần tự trong Streamlit, inference trực tiếp từng frame, render từng frame qua UI, không có hàng đợi, không giới hạn FPS, không tách pipeline decode/inference/render, và không tối ưu model/runtime.

---

## 2. Các điểm yếu hiện tại

### 2.1. Kiến trúc ứng dụng chưa phù hợp production

Hiện tại `app.py` đang gộp quá nhiều trách nhiệm:

- Load model.
- Patch model YOLO12.
- Xử lý UI Streamlit.
- Inference ảnh.
- Inference video.
- Vẽ bounding box.
- So sánh kết quả giữa các model.
- Đọc file cấu hình class.

Điều này làm hệ thống khó mở rộng, khó test, khó debug và khó triển khai production.

**Rủi ro production:**

- Một lỗi ở UI có thể làm hỏng toàn bộ inference flow.
- Không thể scale riêng phần inference.
- Không có API rõ ràng cho client khác sử dụng.
- Khó thay model, thay backend, hoặc thêm camera stream thật.

**Cải thiện:**

- Tách thành các module rõ ràng:
  - `services/model_service.py`: load và quản lý model.
  - `services/inference_service.py`: inference ảnh/video frame.
  - `services/visualization_service.py`: vẽ bbox/label.
  - `configs/model_config.yaml`: cấu hình model path, confidence, input size.
  - `app.py`: chỉ giữ UI.
- Nếu muốn production thật, nên có backend API riêng bằng **FastAPI** và UI chỉ gọi API.

---

### 2.2. Real-time video upload rất lag

Hiện tại video được xử lý bằng vòng lặp:

```python
while st.session_state.run_video:
    ret, frame = cap.read()
    result = model.predict(frame, conf=conf)[0]
    out = result.plot()
    frame_box.image(out_rgb)
```

Pipeline này có nhiều vấn đề:

- Đọc frame, inference, vẽ kết quả và render UI đều chạy tuần tự.
- Không có frame skipping.
- Không giới hạn FPS output.
- Không resize frame trước inference.
- Không batch frame.
- Không có queue/buffer.
- Không có async/background worker.
- Streamlit không phù hợp để stream video real-time FPS cao.
- Mỗi frame đều bị convert qua OpenCV/PIL/RGB nhiều lần.
- `frame_box.image()` liên tục đẩy ảnh mới qua frontend, rất tốn tài nguyên.

**Hậu quả:**

- Video càng dài/càng phân giải cao càng lag.
- UI dễ bị treo vì loop chiếm main thread.
- Nút Stop phản hồi chậm.
- FPS thực tế phụ thuộc trực tiếp vào thời gian inference + render.
- Không mô phỏng được real-time camera production.

**Cải thiện nhanh:**

- Resize frame về kích thước cố định, ví dụ 640px chiều rộng.
- Chỉ inference mỗi N frame, ví dụ 1/3 hoặc 1/5 frame.
- Giới hạn FPS hiển thị, ví dụ 5-10 FPS.
- Không chạy RF-DETR cho video real-time nếu máy không đủ GPU.
- Ưu tiên YOLO11n/YOLO small cho real-time.
- Cho user chọn `frame_skip`, `max_width`, `target_fps`.

**Cải thiện production:**

- Tách pipeline:
  - Thread/process 1: đọc video/camera.
  - Thread/process 2: inference.
  - Thread/process 3: stream kết quả.
- Sử dụng queue giới hạn kích thước để tránh dồn frame.
- Với camera thật, dùng RTSP/WebRTC thay vì upload video qua Streamlit.
- Dùng FastAPI + WebSocket/WebRTC để stream kết quả.
- Dùng TensorRT/ONNX Runtime/OpenVINO để tăng tốc inference.

---

### 2.3. Streamlit không phải lựa chọn tốt cho real-time production

Streamlit rất tốt cho demo nhanh, dashboard nghiên cứu và báo cáo mô hình. Nhưng với real-time video detection, Streamlit có giới hạn:

- Không tối ưu cho low-latency video streaming.
- Rerun/session state dễ gây hành vi khó kiểm soát.
- Khó quản lý nhiều client đồng thời.
- UI và inference thường nằm cùng process.
- Không có kiến trúc event-driven mạnh như WebSocket/WebRTC app.

**Cải thiện:**

- Giữ Streamlit cho demo/report.
- Xây production app riêng:
  - Backend: FastAPI.
  - Streaming: WebSocket hoặc WebRTC.
  - Frontend: React/Vite hoặc HTML/JS đơn giản.
  - Worker inference: Celery/RQ/ProcessPool hoặc service riêng.

---

### 2.4. Model loading và memory footprint nặng

Hiện tại app load cả 3 model ngay khi chạy:

```python
model_yolo11 = load_yolo11()
model_yolo12 = load_yolo12()
model_rfdetr = load_rfdetr_model()
```

Điều này làm:

- Startup chậm.
- Tốn RAM/VRAM.
- Dễ out-of-memory nếu GPU yếu.
- Không cần thiết nếu user chỉ dùng một model.

**Cải thiện:**

- Lazy load model theo lựa chọn của user.
- Cho phép unload model hoặc chỉ giữ một model active.
- Tách model registry để quản lý trạng thái model.
- Log rõ model đang chạy trên CPU hay CUDA.
- Với production, mỗi model có thể là một inference service riêng.

---

### 2.5. Chưa tối ưu inference

Một số điểm chưa tối ưu:

- YOLO chưa cấu hình rõ `device`, `imgsz`, `half`, `verbose=False`.
- RF-DETR có dòng `model.optimize_for_inference()` nhưng đang bị comment.
- Không dùng `torch.inference_mode()` / `torch.no_grad()` ở wrapper chung.
- Không có warmup model.
- Không đo latency từng bước: decode, preprocess, inference, postprocess, render.

**Cải thiện:**

- Với GPU NVIDIA:
  - Dùng FP16 (`half=True`) nếu model hỗ trợ.
  - Export YOLO sang ONNX/TensorRT.
  - Warmup vài frame trước khi chạy thật.
- Với CPU:
  - Dùng model nhỏ hơn.
  - Export ONNX Runtime/OpenVINO.
- Bật tối ưu RF-DETR nếu tương thích:
  - Kiểm tra lại `model.optimize_for_inference()`.
- Thêm benchmark tự động cho từng model.

---

### 2.6. Xử lý video chưa an toàn và chưa sạch tài nguyên

Video upload được ghi vào temp file:

```python
t = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
t.write(uploaded_video.read())
st.session_state.video_path = t.name
```

Vấn đề:

- `delete=False` nhưng không có cleanup.
- Không kiểm tra dung lượng file.
- Không giới hạn độ dài video.
- Không validate codec/container.
- Nếu user upload nhiều video, temp file có thể bị rác.
- Nếu video lỗi/corrupt, app có thể xử lý không ổn định.

**Cải thiện:**

- Giới hạn dung lượng upload, ví dụ 100-300MB.
- Giới hạn duration video.
- Xóa temp file sau khi xử lý xong hoặc khi upload video mới.
- Kiểm tra FPS, width, height, frame count trước khi chạy.
- Thêm `try/finally` để luôn `cap.release()`.

---

### 2.7. Không có logging/monitoring đúng nghĩa

Hiện tại app chủ yếu dùng `st.*` và `print()`. Production cần logging có cấu trúc.

Thiếu:

- Log thời gian load model.
- Log latency inference.
- Log FPS.
- Log lỗi model/video.
- Log tài nguyên CPU/RAM/VRAM.
- Log request/user/session.

**Cải thiện:**

- Dùng Python `logging` thay vì `print`.
- Ghi log dạng JSON nếu cần production.
- Thêm metrics:
  - inference latency p50/p95.
  - FPS trung bình.
  - số frame bị skip.
  - memory usage.
- Production có thể dùng Prometheus + Grafana.

---

### 2.8. Chưa có error handling tốt

Có nhiều đoạn `except:` trống hoặc quá rộng:

```python
try:
    m.to(device)
except:
    pass
```

Vấn đề:

- Che mất lỗi thật.
- Khó biết model có chạy trên GPU không.
- Khi lỗi xảy ra, user chỉ thấy app chậm hoặc sai kết quả.

**Cải thiện:**

- Bắt exception cụ thể.
- Log stack trace.
- Hiển thị cảnh báo rõ ràng nếu fallback CPU.
- Fail fast nếu checkpoint thiếu/sai format.

---

### 2.9. Dependency và reproducibility chưa tốt

`requirements.txt` còn nhiều vấn đề:

- `numpy` xuất hiện hai lần.
- `torch`, `torchvision`, `opencv-python` không pin version.
- Không phân biệt CPU/GPU install.
- Không có file lock.
- Không ghi rõ CUDA version.

**Cải thiện:**

- Tách requirements:
  - `requirements.base.txt`
  - `requirements.cpu.txt`
  - `requirements.gpu.txt`
  - `requirements.dev.txt`
- Pin version quan trọng.
- Ghi rõ Python version.
- Nếu production, dùng Dockerfile.
- Có hướng dẫn cài PyTorch theo CUDA cụ thể.

---

### 2.10. Checkpoint/model artifact quá nặng và quản lý chưa tốt

Repo hiện chứa nhiều file nặng:

- `checkpoint_best_total.pth` khoảng 130MB.
- `yolo11_best.pt` khoảng 51MB.
- `yolo12_best.pt` khoảng 53MB.
- `data_yolo.zip` rất lớn.

Vấn đề:

- Repo nặng, clone/pull chậm.
- Không phù hợp Git thông thường.
- Khó version model/data rõ ràng.
- Dễ nhầm checkpoint nào là production.

**Cải thiện:**

- Dùng Git LFS cho checkpoint lớn.
- Hoặc lưu model ở release/cloud storage và tải theo script.
- Thêm `models/manifest.yaml` ghi rõ:
  - model name.
  - version.
  - metric.
  - input size.
  - checksum.
  - intended use.
- Không commit dataset zip lớn vào repo.

---

### 2.11. Chưa có test và quality gate

Hiện tại chưa thấy test tự động cho:

- Load model.
- Inference một ảnh mẫu.
- Mapping class.
- Format output bbox.
- Video processing với video ngắn.
- App import không lỗi.

**Cải thiện:**

- Thêm `tests/`:
  - `test_model_loading.py`
  - `test_inference_output.py`
  - `test_video_utils.py`
- Dùng ảnh/video mẫu nhỏ trong `tests/assets/`.
- CI kiểm tra lint/import/unit test.
- Không nhất thiết test full model nặng trong CI; có thể mock hoặc smoke test optional.

---

### 2.12. Kết quả detection chưa chuyển thành nghiệp vụ PPE compliance

Hiện tại hệ thống detect object, nhưng chưa thật sự trả lời bài toán production PPE:

- Công nhân có đội helmet không?
- Có mặc safety vest không?
- Có đeo gloves/mask/glasses không?
- Người nào vi phạm?
- Vi phạm trong bao lâu?
- Có cảnh báo không?
- Có lưu bằng chứng frame/video clip không?

Production PPE system cần tầng logic sau detection.

**Cải thiện:**

- Thêm module `compliance_service.py`:
  - Associate PPE item với từng `person` bằng IoU/proximity.
  - Rule engine: helmet required, vest required, gloves optional theo khu vực.
  - Tính violation theo person track ID.
- Thêm tracking:
  - ByteTrack/DeepSORT/OC-SORT.
- Chỉ cảnh báo nếu vi phạm kéo dài N frame/giây để giảm false alarm.

---

### 2.13. Chưa có tracking object qua thời gian

Video hiện xử lý từng frame độc lập. Điều này gây:

- Bbox nhấp nháy.
- Không biết object/person là cùng một người qua các frame.
- Không tính được thời lượng vi phạm.
- Dễ cảnh báo sai nếu model miss detection một vài frame.

**Cải thiện:**

- Tích hợp tracker:
  - ByteTrack cho YOLO.
  - DeepSORT nếu cần appearance embedding.
- Làm smoothing bbox/confidence.
- Lưu trạng thái violation theo track ID.

---

### 2.14. Chưa có cơ chế giảm false positive/false negative

Trong PPE detection, false negative rất nguy hiểm vì bỏ sót vi phạm. False positive cũng gây phiền vì cảnh báo sai.

Thiếu:

- Threshold riêng cho từng class.
- Rule hậu xử lý theo class.
- Calibration confidence.
- Hard-negative mining.
- Phân tích lỗi theo điều kiện ánh sáng/góc camera/khoảng cách.

**Cải thiện:**

- Dùng threshold per class thay vì một `conf` global.
- Lưu các case model sai để fine-tune lại.
- Phân tích confusion matrix theo nhóm PPE quan trọng.
- Thêm validation theo scenario thực tế.

---

### 2.15. UI còn thiên về demo, chưa hỗ trợ vận hành

UI hiện phù hợp demo nhưng chưa có chức năng vận hành:

- Không có dashboard camera/site.
- Không có lịch sử vi phạm.
- Không có export report.
- Không có user/role.
- Không có cấu hình rule theo khu vực.
- Không có trạng thái hệ thống/model.

**Cải thiện:**

- Demo UI:
  - Thêm panel FPS/latency.
  - Hiển thị model/device/input size.
  - Cho chỉnh frame skip/target FPS.
- Production UI:
  - Camera list.
  - Violation timeline.
  - Alert center.
  - Evidence viewer.
  - Rule configuration.

---

### 2.16. Chưa có bảo mật production

Nếu triển khai public/internal network, hiện chưa có:

- Authentication.
- Authorization.
- Rate limiting.
- Upload validation mạnh.
- File size limit rõ ràng.
- Antivirus/content scanning.
- Audit log.

**Cải thiện:**

- Không expose Streamlit trực tiếp ra internet.
- Đặt sau reverse proxy có auth.
- Backend API cần validate upload, giới hạn size/duration.
- Dùng signed URL/object storage cho video lớn.

---

### 2.17. Chưa có deployment strategy rõ ràng

README chỉ hướng dẫn chạy local bằng:

```bash
streamlit run app.py
```

Thiếu:

- Dockerfile.
- GPU Docker runtime hướng dẫn.
- Environment variables.
- Health check.
- Model download script.
- CPU/GPU setup rõ ràng.

**Cải thiện:**

- Thêm Dockerfile cho demo.
- Thêm docker-compose nếu có API/UI riêng.
- Thêm `/health` nếu dùng FastAPI.
- Ghi rõ cấu hình tối thiểu:
  - CPU/RAM.
  - GPU/VRAM.
  - CUDA/cuDNN.

---

## 3. Ưu tiên cải thiện theo mức độ

### Giai đoạn 1: Làm demo chạy mượt hơn

Mục tiêu: vẫn dùng Streamlit nhưng giảm lag rõ rệt.

Việc nên làm:

1. Resize frame trước inference.
2. Thêm frame skipping.
3. Thêm target FPS.
4. Thêm benchmark latency/FPS trên UI.
5. Lazy load model thay vì load cả 3 model.
6. Tắt verbose predict.
7. Dùng `try/finally` để release video.
8. Cleanup temp files.
9. Thêm cảnh báo: RF-DETR không khuyến nghị cho real-time nếu không có GPU mạnh.

---

### Giai đoạn 2: Refactor code để dễ bảo trì

Mục tiêu: code sạch hơn, dễ mở rộng.

Việc nên làm:

1. Tách model service.
2. Tách inference service.
3. Tách visualization service.
4. Tách video utilities.
5. Tách config model/class.
6. Thêm logging chuẩn.
7. Thêm smoke tests.

---

### Giai đoạn 3: Tiệm cận production

Mục tiêu: hệ thống có thể chạy như một service thật.

Việc nên làm:

1. Backend FastAPI cho inference.
2. WebSocket/WebRTC cho stream video.
3. Worker queue cho inference.
4. Export YOLO sang ONNX/TensorRT.
5. Thêm tracking.
6. Thêm PPE compliance rules.
7. Lưu violation event và evidence.
8. Docker hóa.
9. Monitoring/logging/metrics.

---

## 4. Đề xuất kiến trúc production

```text
Camera / Uploaded Video
        |
        v
Video Ingestion Service
        |
        v
Frame Queue  ---> Drop old frames if queue full
        |
        v
Inference Worker GPU
        |
        v
Post-processing + Tracking + PPE Rule Engine
        |
        +----> Alert/Event Database
        |
        +----> Evidence Storage
        |
        v
WebSocket/WebRTC Stream API
        |
        v
Frontend Dashboard
```

Ưu điểm:

- Không để UI gánh inference.
- Có thể scale inference worker riêng.
- Có thể drop frame để giữ latency thấp.
- Có thể lưu violation event phục vụ nghiệp vụ.
- Dễ monitoring và deployment hơn.

---

## 5. Quick wins có thể làm ngay trong code hiện tại

### 5.1. Thêm resize frame

Trước khi inference:

```python
def resize_frame(frame, max_width=640):
    h, w = frame.shape[:2]
    if w <= max_width:
        return frame
    scale = max_width / w
    return cv2.resize(frame, (max_width, int(h * scale)))
```

### 5.2. Thêm frame skipping

```python
frame_idx = 0
frame_skip = 3

while st.session_state.run_video:
    ret, frame = cap.read()
    if not ret:
        break

    frame_idx += 1
    if frame_idx % frame_skip != 0:
        continue
```

### 5.3. Giới hạn FPS render

```python
target_fps = 8
min_interval = 1.0 / target_fps
last_render = 0

now = time.time()
if now - last_render < min_interval:
    continue
last_render = now
```

### 5.4. Cấu hình YOLO predict rõ hơn

```python
result = model.predict(
    frame,
    conf=conf,
    imgsz=640,
    device=0 if torch.cuda.is_available() else "cpu",
    half=torch.cuda.is_available(),
    verbose=False,
)[0]
```

### 5.5. Đo FPS/latency

```python
start = time.time()
result = model.predict(...)[0]
latency_ms = (time.time() - start) * 1000
fps = 1000 / latency_ms if latency_ms > 0 else 0
```

---

## 6. Kết luận

Dự án hiện tại **ổn cho mục tiêu demo/report học phần**, nhưng chưa thể xem là production-ready. Các vấn đề chính gồm:

- Real-time video lag do pipeline tuần tự và Streamlit không phù hợp streaming FPS cao.
- Code gộp nhiều trách nhiệm trong một file.
- Load model nặng, chưa lazy load, chưa tối ưu inference.
- Chưa có tracking, PPE compliance logic, alert/event storage.
- Chưa có logging, monitoring, tests, deployment strategy.
- Quản lý dependency/model artifact chưa tốt.

Nếu muốn cải thiện nhanh, nên bắt đầu từ **frame resize + frame skip + target FPS + lazy model loading**. Nếu muốn hướng production thật, nên chuyển sang kiến trúc **FastAPI + inference worker + WebSocket/WebRTC + tracking + PPE rule engine**.
