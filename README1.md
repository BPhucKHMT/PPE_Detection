# YOLO Object Detection Project

This project implements object detection using YOLO (You Only Look Once) models from Ultralytics. It includes scripts for data setup, training, and evaluation on a custom dataset.

## Project Structure

- `data_setup.py`: Script for preparing and setting up the dataset.
- `train.py`: Script to train YOLO models with configurable parameters.
- `evaluate.py`: Script for evaluating trained models and generating metrics.
- `requirements.txt`: List of Python dependencies.
- `models/`: Directory containing trained model checkpoints and results.
- `results/evaluation/`: Directory with evaluation reports and metrics.
- `runs/detect/`: Directory for detection runs and validation results.
- `notebooks/eda_visualize_data.ipynb`: Jupyter notebook for exploratory data analysis and visualization.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

## Usage

### Training

Run the training script with default parameters:
```sh
python train.py
```

Customize training parameters by modifying the `train_yolo` function call in `train.py`. For example, adjust epochs, batch size, or model name.

### Evaluation

Evaluate a trained model:
```sh
python evaluate.py
```

Results will be saved in `results/evaluation/`.

### Data Setup

Prepare your dataset using:
```sh
python data_setup.py
```

Ensure your data follows the YOLO format with a `data.yaml` file in `data_yolo/`.

## Model Details

- **Model**: YOLO11 Large (yolo11l.pt)
- **Training Config**: 200 epochs, batch size 128, image size 640x640, device CUDA:0
- **Saved Model**: `models/yolo11l_ep200_bs128_img640/weights/best.pt`

## Results

Evaluation metrics and reports are available in `results/evaluation/`, including overall metrics, per-class metrics, and confidence threshold analysis.

## Requirements

- Python 3.x
- PyTorch
- Ultralytics YOLO
- See `requirements.txt` for full list.