# Optimize Model Plan

## Mục tiêu

- Tối ưu pipeline inference để tăng FPS cho luồng upload video realtime.
- Chuẩn bị lộ trình chuyển model từ `.pt` sang ONNX, sau đó sang TensorRT.
- Giảm nhiễu class trước khi chuyển qua tracking (model hiện có 17 class).

---

## 1) Lộ trình chuyển đổi model

### Phase A — PT -> ONNX

- Export model YOLO hiện tại sang ONNX với input cố định (ưu tiên 640 hoặc 512).
- Kiểm tra parity output giữa `.pt` và `.onnx` trên cùng tập video test.
- Ghi nhận:
  - FPS
n  - latency/frame
  - sai lệch mAP / precision / recall

**Checklist:**

- [ ] Export ONNX thành công
- [ ] Chạy benchmark ONNX trên GPU
- [ ] So sánh độ chính xác với bản `.pt`

### Phase B — ONNX -> TensorRT

- Build TensorRT engine từ ONNX (ưu tiên FP16, cân nhắc INT8 sau).
- Benchmark lại trên cùng dataset/clip benchmark.
- Xác nhận ổn định runtime với stream dài.

**Checklist:**

- [ ] Build TensorRT engine thành công
- [ ] Benchmark FPS/latency cải thiện rõ so với ONNX
- [ ] Không crash / leak khi chạy stream dài

---

## 2) Giảm class trước khi tracking

Hiện model có **17 class**. Trước khi tích hợp tracking, cần lọc bớt class gây nhiễu để:

- giảm số bbox không cần thiết,
- giảm false positive,
- tăng ổn định track ID.

### Nguyên tắc giữ/bỏ class

- **Giữ**: class trực tiếp phục vụ PPE compliance phase hiện tại.
- **Bỏ tạm**: class không tham gia rule vi phạm hoặc gây nhiễu cao.

### Active classes đã chốt (triển khai hiện tại)

```python
ACTIVE_CLASSES = {
    "person",
    "helmet",
    "safety-vest",
    "gloves",
    "shoes",
}
```

### Kế hoạch thực hiện

1. Lập bảng 17 class hiện tại + tần suất xuất hiện + false positive rate.
2. Chọn danh sách `active_classes` cho production stream.
3. Áp dụng filter class tại bước postprocess detection.
4. Đo lại:
   - FPS tăng bao nhiêu,
   - false alert giảm bao nhiêu,
   - độ ổn định trước khi bật tracking.

---

## 3) Chuẩn bị cho tracking (sau khi class đã tinh gọn)

- Tích hợp tracker (ByteTrack/OC-SORT) sau khi chốt `active_classes`.
- Violation logic theo `track_id` + cửa sổ thời gian (N frame/N giây).
- Chỉ alert khi vi phạm kéo dài để giảm cảnh báo nhiễu.

---

## 4) KPI đề xuất để chốt từng phase

- **Streaming FPS trung bình**
- **P95 latency/frame**
- **False alert rate**
- **ID switch rate** (khi đã bật tracking)
- **GPU memory usage**

---

## 5) Gợi ý thứ tự triển khai

1. Filter class (từ 17 class xuống tập cần thiết)
2. Benchmark lại bản `.pt`
3. Export ONNX + benchmark
4. Build TensorRT + benchmark
5. Bật tracking + violation-by-track

> Ghi chú: giữ Streamlit như backup cho đến khi pipeline ONNX/TensorRT + tracking ổn định hoàn toàn.
