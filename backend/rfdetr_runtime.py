from __future__ import annotations

from collections import OrderedDict, namedtuple
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from backend.app.core.config import NMS_IOU_THRESHOLD
from backend.model_runtime import Detection

RFDETR_LABELS = {
    0: "SH17",
    1: "ear",
    2: "earmuffs",
    3: "face",
    4: "face-guard",
    5: "face-mask-medical",
    6: "foot",
    7: "glasses",
    8: "gloves",
    9: "hands",
    10: "head",
    11: "helmet",
    12: "medical-suit",
    13: "person",
    14: "safety-suit",
    15: "safety-vest",
    16: "shoes",
    17: "tools",
}


def _sigmoid(values: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-values))


def preprocess_rfdetr_frame(frame: np.ndarray, resolution: int = 576) -> np.ndarray:
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (resolution, resolution), interpolation=cv2.INTER_LINEAR)
    image = resized.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    image = (image - mean) / std
    return np.ascontiguousarray(np.transpose(image, (2, 0, 1))[None])


def apply_classwise_nms(detections: list[Detection], iou_threshold: float) -> list[Detection]:
    if not detections:
        return []

    by_class: dict[int, list[Detection]] = {}
    for detection in detections:
        by_class.setdefault(detection.class_id, []).append(detection)

    kept: list[Detection] = []
    for class_detections in by_class.values():
        boxes = [detection.bbox_xyxy for detection in class_detections]
        scores = [float(detection.confidence) for detection in class_detections]
        selected = cv2.dnn.NMSBoxes(boxes, scores, score_threshold=0.0, nms_threshold=float(iou_threshold))
        if selected is None or len(selected) == 0:
            continue

        indexes = np.array(selected).reshape(-1).tolist()
        for idx in indexes:
            kept.append(class_detections[int(idx)])

    kept.sort(key=lambda detection: float(detection.confidence), reverse=True)
    return kept


def postprocess_rfdetr_outputs(
    dets: np.ndarray,
    labels: np.ndarray,
    image_shape: tuple[int, int],
    conf: float = 0.5,
    num_select: int = 300,
    nms_iou: float = NMS_IOU_THRESHOLD,
) -> list[Detection]:
    if dets.ndim != 3 or labels.ndim != 3:
        raise ValueError("RF-DETR outputs must have batch, query, channel dimensions")

    scores = _sigmoid(labels[0])
    flattened_scores = scores.reshape(-1)
    select_count = min(num_select, flattened_scores.size)
    if select_count == 0:
        return []

    top_indexes = np.argpartition(flattened_scores, -select_count)[-select_count:]
    top_indexes = top_indexes[np.argsort(flattened_scores[top_indexes])[::-1]]

    query_indexes = top_indexes // labels.shape[2]
    class_ids = top_indexes % labels.shape[2]
    top_scores = flattened_scores[top_indexes]

    boxes_cxcywh = dets[0, query_indexes].astype(np.float32)
    widths = np.clip(boxes_cxcywh[:, 2], a_min=0.0, a_max=None)
    heights = np.clip(boxes_cxcywh[:, 3], a_min=0.0, a_max=None)
    boxes = np.stack(
        [
            boxes_cxcywh[:, 0] - 0.5 * widths,
            boxes_cxcywh[:, 1] - 0.5 * heights,
            boxes_cxcywh[:, 0] + 0.5 * widths,
            boxes_cxcywh[:, 1] + 0.5 * heights,
        ],
        axis=1,
    )

    image_height, image_width = image_shape
    boxes *= np.array([image_width, image_height, image_width, image_height], dtype=np.float32)

    detections: list[Detection] = []
    for class_id, confidence, bbox in zip(class_ids, top_scores, boxes):
        if float(confidence) <= conf:
            continue
        class_id = int(class_id)
        detections.append(
            Detection(
                class_id=class_id,
                class_name=RFDETR_LABELS.get(class_id, str(class_id)),
                confidence=float(confidence),
                bbox_xyxy=[float(value) for value in bbox],
            )
        )
    return apply_classwise_nms(detections, nms_iou)


def convert_rfdetr_detections(raw_detections) -> list[Detection]:
    detections: list[Detection] = []
    for xyxy, class_id, confidence in zip(
        raw_detections.xyxy,
        raw_detections.class_id,
        raw_detections.confidence,
    ):
        class_id = int(class_id)
        detections.append(
            Detection(
                class_id=class_id,
                class_name=RFDETR_LABELS.get(class_id, str(class_id)),
                confidence=float(confidence),
                bbox_xyxy=[float(value) for value in xyxy],
            )
        )
    return detections


class RFDETRNativeRuntime:
    backend_name = "rfdetr-native"

    def __init__(self, checkpoint_path: str | Path):
        from rfdetr import RFDETRMedium

        self.model = RFDETRMedium(pretrain_weights=str(checkpoint_path))

    def predict(self, frame, conf: float = 0.5, nms_iou: float = NMS_IOU_THRESHOLD) -> list[Detection]:
        image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).convert("RGB")
        raw = self.model.predict(image, threshold=conf)
        detections = convert_rfdetr_detections(raw)
        return apply_classwise_nms(detections, nms_iou)


class RFDETRONNXRuntime:
    backend_name = "rfdetr-onnx"

    def __init__(self, onnx_path: str | Path, resolution: int = 576):
        import onnxruntime as ort

        self.onnx_path = str(onnx_path)
        self.resolution = resolution
        available_providers = ort.get_available_providers()
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        providers = [provider for provider in providers if provider in available_providers]
        self.session = ort.InferenceSession(self.onnx_path, providers=providers)
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [output.name for output in self.session.get_outputs()]

    def predict(self, frame, conf: float = 0.5, nms_iou: float = NMS_IOU_THRESHOLD) -> list[Detection]:
        model_input = preprocess_rfdetr_frame(frame, self.resolution)
        outputs = dict(zip(self.output_names, self.session.run(self.output_names, {self.input_name: model_input})))
        return postprocess_rfdetr_outputs(
            outputs["dets"],
            outputs["labels"],
            image_shape=frame.shape[:2],
            conf=conf,
            nms_iou=nms_iou,
        )


class RFDETRTensorRTRuntime:
    backend_name = "rfdetr-tensorrt"

    def __init__(self, engine_path: str | Path, device: str = "cuda:0", resolution: int = 576):
        import tensorrt as trt
        import torch

        self.engine_path = str(engine_path)
        self.device = device
        self.resolution = resolution
        self.trt = trt
        self.torch = torch
        self.logger = trt.Logger(trt.Logger.INFO)
        trt.init_libnvinfer_plugins(self.logger, "")
        with open(self.engine_path, "rb") as engine_file, trt.Runtime(self.logger) as runtime:
            self.engine = runtime.deserialize_cuda_engine(engine_file.read())
        if self.engine is None:
            raise RuntimeError(f"Failed to deserialize TensorRT engine: {self.engine_path}")
        self.context = self.engine.create_execution_context()
        self.bindings = self._build_bindings()
        self.binding_addresses = OrderedDict((name, binding.ptr) for name, binding in self.bindings.items())
        self.input_names = self._names_for_mode(trt.TensorIOMode.INPUT)
        self.output_names = self._names_for_mode(trt.TensorIOMode.OUTPUT)

    def _names_for_mode(self, mode) -> list[str]:
        return [name for name in self.engine if self.engine.get_tensor_mode(name) == mode]

    def _build_bindings(self):
        Binding = namedtuple("Binding", ("name", "dtype", "shape", "data", "ptr"))
        bindings = OrderedDict()
        for name in self.engine:
            shape = tuple(self.engine.get_tensor_shape(name))
            if any(dimension < 0 for dimension in shape):
                raise NotImplementedError("Dynamic TensorRT bindings are not supported")
            dtype = self.trt.nptype(self.engine.get_tensor_dtype(name))
            data = self.torch.from_numpy(np.empty(shape, dtype=dtype)).to(self.device)
            bindings[name] = Binding(name, dtype, shape, data, data.data_ptr())
        return bindings

    def predict(self, frame, conf: float = 0.5, nms_iou: float = NMS_IOU_THRESHOLD) -> list[Detection]:
        model_input = preprocess_rfdetr_frame(frame, self.resolution)
        input_tensor = self.torch.from_numpy(model_input).to(self.device)
        self.binding_addresses.update({self.input_names[0]: input_tensor.data_ptr()})
        self.context.execute_v2([int(value) for value in self.binding_addresses.values()])
        outputs = {
            name: self.bindings[name].data.detach().float().cpu().numpy()
            for name in self.output_names
        }
        return postprocess_rfdetr_outputs(
            outputs["dets"],
            outputs["labels"],
            image_shape=frame.shape[:2],
            conf=conf,
            nms_iou=nms_iou,
        )
