import unittest

from backend.model_runtime import Detection


class FakeTrack:
    def __init__(self, track_id: int, bbox_xyxy: list[float], hits: int = 3, age: int = 8, missed: int = 0):
        self.track_id = track_id
        self._bbox_xyxy = bbox_xyxy
        self.hits = hits
        self.age = age
        self.time_since_update = missed

    def is_confirmed(self) -> bool:
        return True

    def to_ltrb(self):
        return tuple(self._bbox_xyxy)


class FakeDeepSortTracker:
    def __init__(self, tracks):
        self._tracks = tracks
        self.last_inputs = None

    def update_tracks(self, detections, frame=None):
        self.last_inputs = detections
        return self._tracks


class TestTrackingService(unittest.TestCase):
    def test_update_tracks_filters_only_person_and_returns_track_payload(self):
        from backend.app.services.tracking_service import TrackingService

        fake_tracker = FakeDeepSortTracker(
            tracks=[FakeTrack(track_id=17, bbox_xyxy=[100.0, 50.0, 220.0, 410.0], hits=4, age=10, missed=0)]
        )
        service = TrackingService(tracker=fake_tracker)

        detections = [
            Detection(class_id=13, class_name="person", confidence=0.95, bbox_xyxy=[100.0, 50.0, 220.0, 410.0]),
            Detection(class_id=11, class_name="helmet", confidence=0.82, bbox_xyxy=[120.0, 60.0, 170.0, 120.0]),
        ]

        tracks = service.update_tracks(detections=detections, frame=None)

        self.assertEqual(len(fake_tracker.last_inputs), 1)
        self.assertEqual(fake_tracker.last_inputs[0][2], "person")
        self.assertEqual(len(tracks), 1)
        self.assertEqual(tracks[0]["track_id"], 17)
        self.assertEqual(tracks[0]["bbox_xyxy"], [100.0, 50.0, 220.0, 410.0])


class TestPPEAssociationService(unittest.TestCase):
    def test_helmet_on_head_marks_worn(self):
        from backend.app.services.ppe_association import associate_ppe_with_tracks

        tracks = [{"track_id": 1, "bbox_xyxy": [100.0, 100.0, 200.0, 300.0]}]
        detections = [
            Detection(class_id=11, class_name="helmet", confidence=0.9, bbox_xyxy=[120.0, 102.0, 170.0, 140.0]),
        ]

        enriched = associate_ppe_with_tracks(tracks, detections)

        self.assertTrue(enriched[0]["ppe_status"]["helmet_present"])
        self.assertTrue(enriched[0]["ppe_status"]["helmet_worn"])

    def test_helmet_on_hand_marks_not_worn(self):
        from backend.app.services.ppe_association import associate_ppe_with_tracks

        tracks = [{"track_id": 1, "bbox_xyxy": [100.0, 100.0, 200.0, 300.0]}]
        detections = [
            Detection(class_id=11, class_name="helmet", confidence=0.9, bbox_xyxy=[120.0, 225.0, 170.0, 270.0]),
        ]

        enriched = associate_ppe_with_tracks(tracks, detections)

        self.assertTrue(enriched[0]["ppe_status"]["helmet_present"])
        self.assertFalse(enriched[0]["ppe_status"]["helmet_worn"])


if __name__ == "__main__":
    unittest.main()
