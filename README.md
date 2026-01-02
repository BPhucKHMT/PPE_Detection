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
│   └── yolo11l_ep200_bs128_img640/ # Kết quả huấn luyện YOLO11 Large
│       ├── args.yaml
│       ├── results.csv
│       └── weights/
│           ├── best.pt
│           └── epoch30.pt
├── notebooks/               # Notebook Jupyter phân tích, trực quan hóa
│   ├── cs406-rf-detr-augmentation.ipynb # Augmentation RF-DETR + Train + Evaluate
│   ├── visualize_data.ipynb             # Trực quan hóa dữ liệu
│   └── yolov12s-100-epochs.ipynb        # Huấn luyện thử nghiệm YOLOv12 bản s
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


### data_rfdetr/
- Dữ liệu gốc cho RF-DETR (định dạng COCO).
- Có thể tải tại https://drive.google.com/drive/folders/1zXJl1N65A6CLhU1O4f-HPAE7VcCg-Vll
- Sau đó giải nén và để cùng cấp với app.py

### data_yolo/
- Dữ liệu chuyển sang định dạng YOLO.
- Có thể tải tại https://drive.google.com/drive/folders/1zXJl1N65A6CLhU1O4f-HPAE7VcCg-Vll
- Sau đó giải nén và để cùng cấp với app.py

### models/
- Chứa checkpoint và kết quả huấn luyện.
- `rf-detr/`: Kết quả RF-DETR.
- `yolo11l_ep200_bs128_img640/`: Kết quả YOLO11 Large.



## Hướng dẫn build và thực thi code

### 1. Cài đặt môi trường
```bash
pip install -r requirements.txt
```
Hoặc sử dụng Anaconda:
```bash
conda create -n cs406 python=3.10
conda activate cs406
pip install -r requirements.txt
```

### 2. Huấn luyện mô hình
- RF-DETR:
	```bash
	python train/RF-DETR/train.py
	```
- YOLO v11/v12:
	```bash
	python train/YOLO_v11+v12/train.py
	```

### 3. Đánh giá mô hình
- RF-DETR:
	```bash
	python train/RF-DETR/evaluate.py
	```
- YOLO v11/v12:
	```bash
	python train/YOLO_v11+v12/evaluate.py
	```

### 4. Chạy giao diện so sánh mô hình
```bash
streamlit run app.py
```

### 5. Lưu ý
- Dữ liệu cần được đặt đúng cấu trúc như mô tả ở trên.
- Các checkpoint mô hình nên được đặt đúng tên và vị trí.
- Kết quả huấn luyện và đánh giá sẽ lưu ở các thư mục `results/` và `runs/`.
- Kết quả lưu ở `results/` và `runs/`.
