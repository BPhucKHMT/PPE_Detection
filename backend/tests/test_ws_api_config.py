import tempfile
import unittest
from pathlib import Path

from backend.ws_api import calculate_frame_timestamp_ms, calculate_realtime_delay
from backend.ws_api import choose_rfdetr_runtime_model, get_runtime_info, normalize_video_fps
from backend.ws_api import get_detection_color


class TestWsApiConfig(unittest.TestCase):
    def test_choose_rfdetr_runtime_prefers_tensorrt_engine(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model_dir = Path(temp_dir)
            checkpoint_path = model_dir / "checkpoint_best_total.pth"
            engine_path = model_dir / "rfdetr_medium_fp32.engine"
            checkpoint_path.touch()
            engine_path.touch()

            model_path, backend_name = choose_rfdetr_runtime_model(model_dir)

        self.assertEqual(model_path, str(engine_path))
        self.assertEqual(backend_name, "rfdetr-tensorrt")

    def test_choose_rfdetr_runtime_falls_back_to_native_checkpoint(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model_dir = Path(temp_dir)
            checkpoint_path = model_dir / "checkpoint_best_total.pth"
            checkpoint_path.touch()

            model_path, backend_name = choose_rfdetr_runtime_model(model_dir)

        self.assertEqual(model_path, str(checkpoint_path))
        self.assertEqual(backend_name, "rfdetr-native")

    def test_runtime_info_includes_backend_and_model_path(self):
        runtime_info = get_runtime_info("tensorrt", "/tmp/model.engine", "cuda:0")

        self.assertEqual(runtime_info["model_backend"], "tensorrt")
        self.assertEqual(runtime_info["model_path"], "/tmp/model.engine")
        self.assertEqual(runtime_info["device"], "cuda:0")

    def test_calculate_realtime_delay_waits_until_video_timestamp(self):
        delay = calculate_realtime_delay(
            video_timestamp_ms=2000,
            stream_started_at=10.0,
            now=10.5,
        )

        self.assertAlmostEqual(delay, 1.5)

    def test_calculate_realtime_delay_never_returns_negative_value(self):
        delay = calculate_realtime_delay(
            video_timestamp_ms=2000,
            stream_started_at=10.0,
            now=13.0,
        )

        self.assertEqual(delay, 0.0)

    def test_normalize_video_fps_uses_valid_source_fps(self):
        self.assertEqual(normalize_video_fps(60.0), 60.0)

    def test_normalize_video_fps_falls_back_for_invalid_values(self):
        self.assertEqual(normalize_video_fps(0.0), 30.0)
        self.assertEqual(normalize_video_fps(float("nan")), 30.0)

    def test_calculate_frame_timestamp_ms_uses_source_fps(self):
        self.assertEqual(calculate_frame_timestamp_ms(frame_index=60, source_fps=60.0), 1000)
        self.assertEqual(calculate_frame_timestamp_ms(frame_index=30, source_fps=30.0), 1000)

    def test_detection_colors_are_distinct_for_active_rfdetr_classes(self):
        active_colors = {
            get_detection_color("person"),
            get_detection_color("helmet"),
            get_detection_color("safety-vest"),
            get_detection_color("gloves"),
            get_detection_color("shoes"),
        }

        self.assertEqual(len(active_colors), 5)

    def test_detection_color_falls_back_for_unknown_class(self):
        self.assertEqual(get_detection_color("unknown"), (160, 160, 160))


if __name__ == "__main__":
    unittest.main()
