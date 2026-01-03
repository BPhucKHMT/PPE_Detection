import os
import json
from rfdetr import RFDETRMedium
import supervision as sv
from tqdm import tqdm
from supervision.metrics import MeanAveragePrecision 
from PIL import Image

model = RFDETRMedium(pretrain_weights="checkpoint_best_total.pth")

class Dataset:
    def __init__(self, location):
        self.location = location

dataset = Dataset("data_rfdetr")

ds = sv.DetectionDataset.from_coco(
    images_directory_path=f"{dataset.location}/valid",
    annotations_path=f"{dataset.location}/valid/_annotations.coco.json",
)


targets = []
predictions = []

for path, image, annotations in tqdm(ds):
    image = Image.open(path)
    detections = model.predict(image, threshold=0)

    targets.append(annotations)
    predictions.append(detections)

map_metric = MeanAveragePrecision()
map_result = map_metric.update(predictions, targets).compute()
print(map_result)