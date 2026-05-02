import unittest


class TestWsStreamPayload(unittest.TestCase):
    def test_build_stream_frame_payload_includes_tracks_and_alerts(self):
        from backend.app.api.ws_routes import build_stream_frame_payload

        payload = build_stream_frame_payload(
            frame_b64="abc",
            processed_frames=5,
            frame_index=12,
            timestamp_ms=400,
            source_fps=30.0,
            output_fps=30.0,
            boxes_before_filter=4,
            boxes_after_filter=3,
            detections=[{"class_name": "person"}],
            tracks=[{"track_id": 7}],
            alerts=[{"code": "HELMET_NOT_WORN"}],
        )

        self.assertEqual(payload["type"], "frame")
        self.assertEqual(payload["tracks"], [{"track_id": 7}])
        self.assertEqual(payload["alerts"][0]["code"], "HELMET_NOT_WORN")

    def test_build_stream_frame_payload_keeps_existing_fields(self):
        from backend.app.api.ws_routes import build_stream_frame_payload

        payload = build_stream_frame_payload(
            frame_b64="abc",
            processed_frames=1,
            frame_index=1,
            timestamp_ms=33,
            source_fps=30.0,
            output_fps=30.0,
            boxes_before_filter=2,
            boxes_after_filter=1,
            detections=[],
            tracks=[],
            alerts=[],
        )

        self.assertEqual(payload["frame"], "abc")
        self.assertEqual(payload["processed_frames"], 1)
        self.assertEqual(payload["boxes_before_filter"], 2)
        self.assertEqual(payload["boxes_after_filter"], 1)
        self.assertIn("detections", payload)


if __name__ == "__main__":
    unittest.main()
