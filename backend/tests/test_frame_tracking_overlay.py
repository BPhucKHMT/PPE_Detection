import unittest

import numpy as np


class TestTrackingOverlay(unittest.TestCase):
    def test_annotate_tracking_overlay_draws_track_information(self):
        from backend.app.services.frame_processing import annotate_tracking_overlay

        frame = np.zeros((200, 200, 3), dtype=np.uint8)
        tracks = [
            {
                "track_id": 9,
                "bbox_xyxy": [20.0, 20.0, 120.0, 160.0],
                "violation": {"state": "CONFIRMED_VIOLATION", "missing_items": ["helmet_not_worn"]},
            }
        ]

        annotated = annotate_tracking_overlay(frame, tracks)

        self.assertEqual(annotated.shape, frame.shape)
        self.assertGreater(int(annotated.sum()), 0)


if __name__ == "__main__":
    unittest.main()
