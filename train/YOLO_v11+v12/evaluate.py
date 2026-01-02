"""Comprehensive YOLO11 model evaluation script for Safety Equipment Detection."""
import os
import json
from pathlib import Path
import pandas as pd
import numpy as np
import yaml
from ultralytics import YOLO
import torch
from datetime import datetime


def evaluate_model(
    model_path='models/yolo11l_ep200_bs128_img640/weights/best.pt',
    data_yaml='data_yolo/data.yaml',
    split='val',
    imgsz=640,
    batch=128,
    conf_thres=0.25,
    iou_thres=0.7,
    save_dir='results/evaluation_epoch_80'
):
    """
    Comprehensive model evaluation with all metrics.
    
    Args:
        model_path: path to trained model weights
        data_yaml: path to data configuration
        split: dataset split to evaluate (val/test)
        imgsz: image size
        batch: batch size
        conf_thres: confidence threshold
        iou_thres: IoU threshold for NMS
        save_dir: directory to save results
    """
    print("="*80)
    print("COMPREHENSIVE MODEL EVALUATION")
    print("="*80)
    
    # Create save directory
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    
    # Check model exists
    if not Path(model_path).exists():
        print(f"Error: Model not found at {model_path}")
        return None
    
    # Load model
    print(f"\nLoading model from: {model_path}")
    model = YOLO(model_path)
    
    # Load data config to get class names
    with open(data_yaml, 'r') as f:
        data_config = yaml.safe_load(f)
    class_names = data_config['names']
    num_classes = data_config['nc']
    
    print(f"Number of classes: {num_classes}")
    print(f"Classes: {list(class_names.values())}\n")
    
    # ========================================================================
    # 1. RUN VALIDATION
    # ========================================================================
    print("="*80)
    print("RUNNING VALIDATION")
    print("="*80)
    
    results = model.val(
        data=data_yaml,
        split=split,
        imgsz=imgsz,
        batch=batch,
        conf=conf_thres,
        iou=iou_thres,
        save_json=True,
        save_hybrid=False,
        plots=True,
        verbose=True
    )
    
    print(f"\nValidation completed")
    print(f"Results saved to: {results.save_dir}\n")
    
    # ========================================================================
    # 2. EXTRACT METRICS
    # ========================================================================
    print("="*80)
    print("EXTRACTING METRICS")
    print("="*80)
    
    # Overall metrics
    overall_metrics = {
        'Precision': float(results.box.mp),
        'Recall': float(results.box.mr),
        'mAP50': float(results.box.map50),
        'mAP50-95': float(results.box.map),
        'F1-Score': float(2 * results.box.mp * results.box.mr / (results.box.mp + results.box.mr + 1e-6))
    }
    
    print("\n=== OVERALL METRICS ===")
    for metric, value in overall_metrics.items():
        print(f"{metric:15s}: {value:.4f}")
    
    # Per-class metrics
    per_class_metrics = []
    print("\n=== PER-CLASS METRICS ===")
    print(f"{'Class':<20} {'P':>8} {'R':>8} {'AP50':>8} {'AP50-95':>8} {'F1':>8} {'Support':>8}")
    print("-" * 90)
    
    # Try to get support from confusion matrix
    support_per_class = [0] * num_classes
    if hasattr(results, 'confusion_matrix') and results.confusion_matrix is not None:
        # Confusion matrix có shape [num_classes+1, num_classes+1] (thêm background)
        cm = results.confusion_matrix.matrix
        if cm is not None:
            # Support = tổng số GT của mỗi class (sum theo hàng, bỏ background)
            for i in range(min(num_classes, len(cm)-1)):
                support_per_class[i] = int(cm[i].sum())
    
    for i in range(num_classes):
        class_name = class_names[i]
        precision = float(results.box.p[i]) if i < len(results.box.p) else 0.0
        recall = float(results.box.r[i]) if i < len(results.box.r) else 0.0
        ap50 = float(results.box.ap50[i]) if i < len(results.box.ap50) else 0.0
        ap = float(results.box.ap[i]) if i < len(results.box.ap) else 0.0
        f1 = 2 * precision * recall / (precision + recall + 1e-6)
        support = support_per_class[i]
        
        per_class_metrics.append({
            'Class': class_name,
            'Precision': precision,
            'Recall': recall,
            'AP50': ap50,
            'AP50-95': ap,
            'F1-Score': f1,
            'Support': support
        })
        
        print(f"{class_name:<20} {precision:>8.4f} {recall:>8.4f} {ap50:>8.4f} {ap:>8.4f} {f1:>8.4f} {support:>8}")
    
    # ========================================================================
    # 3. CRITICAL PAIRS ANALYSIS (Safety Equipment)
    # ========================================================================
    print("\n" + "="*80)
    print("CRITICAL PAIRS ANALYSIS (Equipment vs Body Parts)")
    print("="*80)
    
    # Define critical pairs
    critical_pairs = [
        ('helmet', 'head'),
        ('gloves', 'hands'),
        ('shoes', 'foot'),
        ('glasses', 'face'),
        ('safety-vest', 'person'),
        ('face-mask-medical', 'face'),
        ('earmuffs', 'ear')
    ]
    
    pair_analysis = []
    print(f"\n{'Equipment':<20} {'Body Part':<20} {'Equip Recall':>15} {'Body Recall':>15} {'Ratio':>10}")
    print("-" * 82)
    
    for equipment, body_part in critical_pairs:
        # Find indices
        equip_idx = None
        body_idx = None
        
        for idx, name in class_names.items():
            if name == equipment:
                equip_idx = idx
            if name == body_part:
                body_idx = idx
        
        if equip_idx is not None and body_idx is not None:
            equip_recall = per_class_metrics[equip_idx]['Recall']
            body_recall = per_class_metrics[body_idx]['Recall']
            ratio = equip_recall / (body_recall + 1e-6)
            
            pair_analysis.append({
                'Equipment': equipment,
                'Body_Part': body_part,
                'Equipment_Recall': equip_recall,
                'Body_Recall': body_recall,
                'Ratio': ratio
            })
            
            print(f"{equipment:<20} {body_part:<20} {equip_recall:>15.4f} {body_recall:>15.4f} {ratio:>10.4f}")
    
    # ========================================================================
    # 4. CONFIDENCE THRESHOLD ANALYSIS
    # ========================================================================
    print("\n" + "="*80)
    print("CONFIDENCE THRESHOLD ANALYSIS")
    print("="*80)
    
    conf_thresholds = [0.1, 0.25, 0.5, 0.75, 0.9]
    threshold_analysis = []
    
    print(f"\n{'Conf Threshold':>15} {'Precision':>12} {'Recall':>12} {'F1-Score':>12}")
    print("-" * 53)
    
    for conf in conf_thresholds:
        # Run validation with different confidence threshold
        temp_results = model.val(
            data=data_yaml,
            split=split,
            imgsz=imgsz,
            batch=batch,
            conf=conf,
            iou=iou_thres,
            verbose=False
        )
        
        p = float(temp_results.box.mp)
        r = float(temp_results.box.mr)
        f1 = 2 * p * r / (p + r + 1e-6)
        
        threshold_analysis.append({
            'Confidence': conf,
            'Precision': p,
            'Recall': r,
            'F1-Score': f1
        })
        
        print(f"{conf:>15.2f} {p:>12.4f} {r:>12.4f} {f1:>12.4f}")
    
    # ========================================================================
    # 5. SIZE-BASED METRICS (if available)
    # ========================================================================
    print("\n" + "="*80)
    print("SIZE-BASED METRICS")
    print("="*80)
    
    size_metrics = {
        'AP_small': 'N/A',
        'AP_medium': 'N/A',
        'AP_large': 'N/A'
    }
    
    # Try to get size-based metrics from COCO evaluation
    try:
        # Check if predictions.json exists
        pred_json = Path(results.save_dir) / 'predictions.json'
        if pred_json.exists():
            print("\nSize-based metrics require COCO-style evaluation.")
            print("This can be computed separately using pycocotools.")
        else:
            print("\nSize-based metrics not available.")
    except Exception as e:
        print(f"\nCould not compute size-based metrics: {e}")
    
    # ========================================================================
    # 6. SPEED METRICS
    # ========================================================================
    print("\n" + "="*80)
    print("SPEED METRICS")
    print("="*80)
    
    speed_metrics = {
        'Preprocess_ms': float(results.speed['preprocess']),
        'Inference_ms': float(results.speed['inference']),
        'Postprocess_ms': float(results.speed['postprocess']),
        'Total_ms': float(results.speed['preprocess'] + results.speed['inference'] + results.speed['postprocess']),
        'FPS': 1000.0 / (results.speed['preprocess'] + results.speed['inference'] + results.speed['postprocess'])
    }
    
    print(f"\nPreprocess:  {speed_metrics['Preprocess_ms']:.2f} ms")
    print(f"Inference:   {speed_metrics['Inference_ms']:.2f} ms")
    print(f"Postprocess: {speed_metrics['Postprocess_ms']:.2f} ms")
    print(f"Total:       {speed_metrics['Total_ms']:.2f} ms")
    print(f"FPS:         {speed_metrics['FPS']:.2f}")
    
    # ========================================================================
    # 7. MODEL INFO
    # ========================================================================
    print("\n" + "="*80)
    print("MODEL INFORMATION")
    print("="*80)
    
    model_info = {
        'Model_path': str(model_path),
        'Parameters': sum(p.numel() for p in model.model.parameters()),
        'GFLOPs': 'N/A',  # Would need to compute separately
        'Model_size_MB': Path(model_path).stat().st_size / (1024 * 1024)
    }
    
    print(f"\nModel: {model_info['Model_path']}")
    print(f"Parameters: {model_info['Parameters']:,}")
    print(f"Model size: {model_info['Model_size_MB']:.2f} MB")
    
    # ========================================================================
    # 8. SAVE ALL RESULTS
    # ========================================================================
    print("\n" + "="*80)
    print("SAVING RESULTS")
    print("="*80)
    
    # Save overall metrics
    overall_df = pd.DataFrame([overall_metrics])
    overall_csv = save_path / 'overall_metrics.csv'
    overall_df.to_csv(overall_csv, index=False)
    print(f"\nOverall metrics: {overall_csv}")
    
    # Save per-class metrics
    per_class_df = pd.DataFrame(per_class_metrics)
    per_class_csv = save_path / 'per_class_metrics.csv'
    per_class_df.to_csv(per_class_csv, index=False)
    print(f"Per-class metrics: {per_class_csv}")
    
    # Save critical pairs analysis
    if pair_analysis:
        pairs_df = pd.DataFrame(pair_analysis)
        pairs_csv = save_path / 'critical_pairs_analysis.csv'
        pairs_df.to_csv(pairs_csv, index=False)
        print(f"Critical pairs analysis: {pairs_csv}")
    
    # Save threshold analysis
    threshold_df = pd.DataFrame(threshold_analysis)
    threshold_csv = save_path / 'confidence_threshold_analysis.csv'
    threshold_df.to_csv(threshold_csv, index=False)
    print(f"Confidence threshold analysis: {threshold_csv}")
    
    # Save speed metrics
    speed_df = pd.DataFrame([speed_metrics])
    speed_csv = save_path / 'speed_metrics.csv'
    speed_df.to_csv(speed_csv, index=False)
    print(f"Speed metrics: {speed_csv}")
    
    # Save model info
    model_info_df = pd.DataFrame([model_info])
    model_info_csv = save_path / 'model_info.csv'
    model_info_df.to_csv(model_info_csv, index=False)
    print(f"Model info: {model_info_csv}")
    
    # ========================================================================
    # 9. CREATE SUMMARY REPORT
    # ========================================================================
    print("\n" + "="*80)
    print("CREATING SUMMARY REPORT")
    print("="*80)
    
    report_path = save_path / 'evaluation_report.txt'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("YOLO11 SAFETY EQUIPMENT DETECTION - EVALUATION REPORT\n")
        f.write("="*80 + "\n\n")
        
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Model: {model_path}\n")
        f.write(f"Dataset: {data_yaml}\n")
        f.write(f"Split: {split}\n")
        f.write(f"Image size: {imgsz}\n")
        f.write(f"Confidence threshold: {conf_thres}\n")
        f.write(f"IoU threshold: {iou_thres}\n\n")
        
        f.write("="*80 + "\n")
        f.write("OVERALL METRICS\n")
        f.write("="*80 + "\n")
        for metric, value in overall_metrics.items():
            f.write(f"{metric:15s}: {value:.4f}\n")
        
        f.write("\n" + "="*80 + "\n")
        f.write("PER-CLASS METRICS\n")
        f.write("="*80 + "\n")
        f.write(per_class_df.to_string(index=False))
        
        if pair_analysis:
            f.write("\n\n" + "="*80 + "\n")
            f.write("CRITICAL PAIRS ANALYSIS\n")
            f.write("="*80 + "\n")
            f.write(pairs_df.to_string(index=False))
        
        f.write("\n\n" + "="*80 + "\n")
        f.write("CONFIDENCE THRESHOLD ANALYSIS\n")
        f.write("="*80 + "\n")
        f.write(threshold_df.to_string(index=False))
        
        f.write("\n\n" + "="*80 + "\n")
        f.write("SPEED METRICS\n")
        f.write("="*80 + "\n")
        for metric, value in speed_metrics.items():
            f.write(f"{metric:20s}: {value:.2f}\n")
        
        f.write("\n" + "="*80 + "\n")
        f.write("MODEL INFORMATION\n")
        f.write("="*80 + "\n")
        for key, value in model_info.items():
            f.write(f"{key:20s}: {value}\n")
        
        f.write("\n" + "="*80 + "\n")
        f.write("END OF REPORT\n")
        f.write("="*80 + "\n")
    
    print(f"\n✅ Summary report: {report_path}")
    
    # ========================================================================
    # 10. COPY PLOTS FROM VALIDATION
    # ========================================================================
    print("\n" + "="*80)
    print("COPYING VISUALIZATION PLOTS")
    print("="*80)
    
    val_dir = Path(results.save_dir)
    plot_files = [
        'confusion_matrix.png',
        'confusion_matrix_normalized.png',
        'F1_curve.png',
        'P_curve.png',
        'R_curve.png',
        'PR_curve.png',
        'labels.jpg',
        'labels_correlogram.jpg'
    ]
    
    for plot_file in plot_files:
        src = val_dir / plot_file
        if src.exists():
            import shutil
            dst = save_path / plot_file
            shutil.copy2(src, dst)
            print(f"Copied: {plot_file}")
    
    print("\n" + "="*80)
    print("EVALUATION COMPLETED!")
    print("="*80)
    print(f"\nAll results saved to: {save_path}")
    print(f"Validation results: {val_dir}")
    
    return {
        'overall_metrics': overall_metrics,
        'per_class_metrics': per_class_metrics,
        'critical_pairs': pair_analysis,
        'threshold_analysis': threshold_analysis,
        'speed_metrics': speed_metrics,
        'model_info': model_info,
        'save_dir': str(save_path),
        'val_dir': str(val_dir)
    }


if __name__ == '__main__':
    # Evaluate trained model
    results = evaluate_model(
        model_path='/workspace/models/yolo11l_ep200_bs128_img640/weights/best.pt',
        data_yaml='/workspace/data_yolo/data.yaml',
        split='val',
        imgsz=640,
        batch=128,
        conf_thres=0.67, #Defult = 0.25
        iou_thres=0.7,   # iOu_threshold = 0.7
        save_dir='results/evaluation'
    )