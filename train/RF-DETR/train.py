from rfdetr import RFDETRMedium
from roboflow import download_dataset

#dataset = download_dataset("https://app.roboflow.com/baophuc/sh17-0rzqa-6gl3t/1", "coco")
class Dataset:
    def __init__(self, location):
        self.location = location

dataset = Dataset("data_rfdetr")


model = RFDETRMedium()
#history = []

#def callback2(data):
	#history.append(data)

#model.callbacks["on_fit_epoch_end"].append(callback2)

model.train(dataset_dir=dataset.location, output_dir="models/rf-detr",epochs=40, batch_size=6, lr=1e-4, 
             weight_decay=5e-4,  # Regularization mạnh hơn
            use_ema=True,  # BẮT BUỘC cho imbalanced data
            grad_accum_steps=5,
           resume = "/kaggle/working/data_v2/checkpoint.pth")