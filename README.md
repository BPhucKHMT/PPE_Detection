# CS406 Final Report - Cấu trúc thư mục dự án

## Sơ đồ cây thư mục

```
├── app.py                  # Ứng dụng giao diện so sánh mô hình
├── checkpoint_best_total.pth # Checkpoint mô hình RF-DETR
├── README.md               # Tài liệu mô tả dự án
├── requirements.txt        # Danh sách thư viện Python
├── rf_detr_loader.py       # Hàm tải mô hình RF-DETR
├── yolo11_best.pt          # Checkpoint YOLOv11
├── yolo11n.pt              # Checkpoint YOLOv11n
├── yolo12_best.pt          # Checkpoint YOLOv12
├── data_rfdetr/            # Dữ liệu gốc cho RF-DETR (COCO)
│   ├── README.dataset.txt      # Hướng dẫn về dữ liệu
│   ├── README.roboflow.txt     # Hướng dẫn tải dữ liệu từ Roboflow
│   ├── train/                  # Ảnh và annotation tập train
│   │   └── _annotations.coco.json
│   ├── valid/                  # Ảnh và annotation tập valid
│   │   └── _annotations.coco.json
│   └── test/                   # Ảnh và annotation tập test
│       └── _annotations.coco.json
├── data_yolo/               # Dữ liệu chuyển sang định dạng YOLO
│   ├── data.yaml                # Cấu hình cho YOLO
│   ├── train/                   # Ảnh và nhãn tập train
│   │   ├── images/
│   │   └── labels/
│   ├── valid/                   # Ảnh và nhãn tập valid
│   │   ├── images/
│   │   └── labels/
│   └── test/                    # Ảnh và nhãn tập test
│       ├── images/
│       └── labels/
├── models/                  # Chứa checkpoint và kết quả huấn luyện
│   ├── rf-detr/                 # Kết quả huấn luyện RF-DETR
│   │   └── log.txt
│   └── yolo11l_ep200_bs128_img640/ # Kết quả huấn luyện YOLO11 Large
│       ├── args.yaml
│       ├── results.csv
│       └── weights/
│           ├── best.pt
│           └── epoch30.pt
├── notebooks/               # Notebook Jupyter phân tích, trực quan hóa
│   ├── cs406-rf-detr-augmentation.ipynb # Augmentation RF-DETR
│   ├── visualize_data.ipynb             # Trực quan hóa dữ liệu
│   └── yolov12s-100-epochs.ipynb        # Huấn luyện thử nghiệm YOLOv12
├── results/                  # Báo cáo đánh giá mô hình
│   └── evaluation/               # Các file kết quả, metric
│       ├── confidence_threshold_analysis.csv
│       ├── critical_pairs_analysis.csv
│       ├── evaluation_report.txt
│       ├── model_info.csv
│       ├── overall_metrics.csv
│       ├── per_class_metrics.csv
│       └── speed_metrics.csv
├── runs/                     # Kết quả các lần chạy phát hiện
│   └── detect/                   # Kết quả phát hiện trên tập kiểm thử
│       ├── val/
│       ├── val2/
│       └── ...
├── train/                    # Script huấn luyện và đánh giá
│   ├── RF-DETR/                  # Script cho RF-DETR
│   │   ├── evaluate.py
│   │   └── train.py
│   └── YOLO_v11+v12/             # Script cho YOLO
│       ├── data_setup.py
│       ├── evaluate.py
│       ├── train.py
│       └── __pycache__/
```

## Giải thích các thư mục

- **app.py**: Ứng dụng giao diện so sánh mô hình.
- **requirements.txt**: Thư viện Python cần thiết.
- **rf_detr_loader.py**: Hàm tải mô hình RF-DETR.
- **yolo11_best.pt, yolo11n.pt, yolo12_best.pt**: Checkpoint mô hình YOLO.
- **checkpoint_best_total.pth**: Checkpoint RF-DETR.

### data_rfdetr/
- Dữ liệu gốc cho RF-DETR (định dạng COCO).
- `train/`, `valid/`, `test/`: Ảnh và annotation COCO.

### data_yolo/
- Dữ liệu chuyển sang định dạng YOLO.
- `data.yaml`: Cấu hình cho YOLO.
- `train/`, `valid/`, `test/`: Ảnh và nhãn YOLO.

### models/
- Chứa checkpoint và kết quả huấn luyện.
- `rf-detr/`: Kết quả RF-DETR.
- `yolo11l_ep200_bs128_img640/`: Kết quả YOLO11 Large.

### notebooks/
- Notebook Jupyter phân tích, trực quan hóa, thử nghiệm.

### results/
- Báo cáo đánh giá mô hình.
- `evaluation/`: Các file kết quả, metric.

### runs/
- Kết quả các lần chạy phát hiện đối tượng.

### train/
- Script huấn luyện và đánh giá từng mô hình.
- `RF-DETR/`: Script cho RF-DETR.
- `YOLO_v11+v12/`: Script cho YOLO.

---

**Lưu ý:**
- Sử dụng các script trong `train/` để huấn luyện hoặc đánh giá.
- Dữ liệu cần chuẩn hóa đúng định dạng.
- Kết quả lưu ở `results/` và `runs/`.
