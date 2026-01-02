"""YOLO training script."""
import os
from pathlib import Path
from ultralytics import YOLO
import torch
import ultralytics
print(ultralytics.checks())

def train_yolo(
    model_name='yolo11n.pt',
    data_yaml='data_yolo/data.yaml',
    epochs=200,
    batch_size=32,
    img_size=640,
    project='models',
    name='yolo11l_exp',
    device=0,
    patience=50,
    save_period=10
):
    """
    Train YOLO model.
    
    Args:
        model_name: YOLO model name or path
        data_yaml: path to data.yaml
        epochs: number of training epochs
        batch_size: batch size
        img_size: image size
        project: project directory
        name: experiment name
        device: device to train on (0 for cuda:0, None for auto)
        patience: early stopping patience
        save_period: save checkpoint every N epochs
    """
    print("="*80)
    print("YOLO11 TRAINING")
    print("="*80)
    
    # Check CUDA availability
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA device: {torch.cuda.get_device_name(0)}")
        print(f"CUDA version: {torch.version.cuda}")
        print(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        print("WARNING: CUDA not available, training will be slow!")
    
    # Verify data.yaml exists
    if not Path(data_yaml).exists():
        print(f"\nError: {data_yaml} not found!")
        print("Please run data_setup.py first to convert dataset.")
        return None
    
    # Load model
    print(f"\nLoading model: {model_name}")
    model = YOLO(model_name)
    
    # Print model info
    print(f"Model: YOLO11 Large")
    print(f"Parameters: ~{sum(p.numel() for p in model.model.parameters()) / 1e6:.1f}M")
    
    # Training configuration
    print(f"\n{'='*80}")
    print("TRAINING CONFIGURATION")
    print(f"{'='*80}")
    print(f"  Data: {data_yaml}")
    print(f"  Epochs: {epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Image size: {img_size}")
    print(f"  Device: cuda:{device}" if device is not None else "  Device: auto")
    print(f"  Patience: {patience}")
    print(f"  Save period: {save_period}")
    print(f"  Output: {project}/{name}")
    print(f"{'='*80}\n")
    
    # Train
    print("Starting training...\n")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        project=project,
        name=name,
        device=device,
        patience=patience,
        save=True,
        save_period=save_period,
        plots=True,
        val=True
    )
    
    print("\n" + "="*80)
    print("TRAINING COMPLETED!")
    print("="*80)
    print(f"Results saved to: {results.save_dir}")
    print(f"Best weights: {results.save_dir}/weights/best.pt")
    print(f"Last weights: {results.save_dir}/weights/last.pt")
    
    return results


if __name__ == '__main__':
    import os
    print(os.listdir())
    # Training configuration
    results = train_yolo(
        model_name='yolo11n.pt',          # YOLO11 Large
        data_yaml='data_yolo/data.yaml',
        epochs=200,
        batch_size=128,                     # Tăng lên 32 vì có CUDA
        img_size=640,
        project='models',
        name='yolo11l_ep200_bs128_img640',
        device=0,                          # cuda:0
        patience=50,
        save_period=10
    )

