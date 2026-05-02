import unittest

from backend.model_runtime import Detection, detections_to_payload


class TestDetectionRuntimeContract(unittest.TestCase):
    def test_detections_to_payload_matches_websocket_contract(self):
        detections = [
            Detection(
                class_id=13,
                class_name="person",
                confidence=0.91,
                bbox_xyxy=[1.0, 2.0, 30.0, 40.0],
            )
        ]

        payload = detections_to_payload(detections)

        self.assertEqual(
            payload,
            [
                {
                    "class_id": 13,
                    "class_name": "person",
                    "confidence": 0.91,
                    "bbox_xyxy": [1.0, 2.0, 30.0, 40.0],
                }
            ],
        )


class FakeDetections:
    xyxy = [[1, 2, 30, 40]]
    class_id = [13]
    confidence = [0.91]


class TestRFDETRRuntime(unittest.TestCase):
    def test_rfdetr_detections_convert_to_shared_contract(self):
        from backend.rfdetr_runtime import convert_rfdetr_detections

        detections = convert_rfdetr_detections(FakeDetections())

        self.assertEqual(detections[0].class_name, "person")
        self.assertEqual(detections[0].class_id, 13)
        self.assertEqual(detections[0].bbox_xyxy, [1.0, 2.0, 30.0, 40.0])

    def test_rfdetr_outputs_postprocess_to_thresholded_detections(self):
        import numpy as np

        from backend.rfdetr_runtime import postprocess_rfdetr_outputs

        dets = np.array([[[0.5, 0.5, 0.25, 0.5]]], dtype=np.float32)
        labels = np.full((1, 1, 18), -10.0, dtype=np.float32)
        labels[0, 0, 13] = 10.0

        detections = postprocess_rfdetr_outputs(dets, labels, image_shape=(200, 100), conf=0.5)

        self.assertEqual(len(detections), 1)
        self.assertEqual(detections[0].class_id, 13)
        self.assertEqual(detections[0].class_name, "person")
        self.assertGreater(detections[0].confidence, 0.99)
        self.assertEqual(detections[0].bbox_xyxy, [37.5, 50.0, 62.5, 150.0])


if __name__ == "__main__":
    unittest.main()
