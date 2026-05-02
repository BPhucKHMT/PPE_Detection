import unittest

import numpy as np

from video_optimization import VideoOptimizationConfig, resize_frame, should_process_frame, should_render_frame


class TestVideoOptimization(unittest.TestCase):
    def test_resize_frame_limits_width_and_preserves_aspect_ratio(self):
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)

        resized = resize_frame(frame, max_width=640)

        self.assertEqual(resized.shape, (360, 640, 3))

    def test_resize_frame_keeps_small_frame_unchanged(self):
        frame = np.zeros((360, 640, 3), dtype=np.uint8)

        resized = resize_frame(frame, max_width=640)

        self.assertIs(resized, frame)

    def test_should_process_frame_respects_frame_skip(self):
        config = VideoOptimizationConfig(frame_skip=3)

        decisions = [should_process_frame(i, config) for i in range(1, 7)]

        self.assertEqual(decisions, [False, False, True, False, False, True])

    def test_should_render_frame_respects_target_fps(self):
        config = VideoOptimizationConfig(target_fps=10)

        self.assertFalse(should_render_frame(now=1.05, last_render_time=1.0, config=config))
        self.assertTrue(should_render_frame(now=1.10, last_render_time=1.0, config=config))


if __name__ == "__main__":
    unittest.main()
