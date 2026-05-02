import unittest


class TestAlertEngine(unittest.TestCase):
    def _build_engine(self):
        from backend.app.services.alert_engine import AlertEngine

        return AlertEngine(
            violation_threshold_ms=2000,
            cooldown_ms=5000,
            escalation_ms=10000,
            min_track_age=8,
            min_track_hits=3,
        )

    def _base_track(self):
        return {
            "track_id": 7,
            "age": 10,
            "hits": 4,
            "missed": 0,
            "bbox_xyxy": [100.0, 100.0, 200.0, 300.0],
            "ppe_status": {
                "helmet_present": True,
                "helmet_worn": False,
                "safety_vest": True,
                "gloves": True,
                "shoes": True,
            },
        }

    def test_no_alert_before_violation_threshold(self):
        engine = self._build_engine()
        tracks, alerts = engine.evaluate_tracks([self._base_track()], timestamp_ms=1000)

        self.assertEqual(tracks[0]["violation"]["state"], "SUSPECTED_VIOLATION")
        self.assertEqual(alerts, [])

    def test_emit_helmet_not_worn_after_threshold(self):
        engine = self._build_engine()

        engine.evaluate_tracks([self._base_track()], timestamp_ms=1000)
        tracks, alerts = engine.evaluate_tracks([self._base_track()], timestamp_ms=3200)

        self.assertEqual(tracks[0]["violation"]["state"], "CONFIRMED_VIOLATION")
        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["code"], "HELMET_NOT_WORN")
        self.assertEqual(alerts[0]["severity"], "high")

    def test_apply_cooldown_for_same_signature(self):
        engine = self._build_engine()

        engine.evaluate_tracks([self._base_track()], timestamp_ms=1000)
        _, first_alerts = engine.evaluate_tracks([self._base_track()], timestamp_ms=3200)
        _, second_alerts = engine.evaluate_tracks([self._base_track()], timestamp_ms=3400)

        self.assertEqual(len(first_alerts), 1)
        self.assertEqual(second_alerts, [])

    def test_escalate_to_critical_for_long_violation(self):
        engine = self._build_engine()

        engine.evaluate_tracks([self._base_track()], timestamp_ms=1000)
        _, alerts = engine.evaluate_tracks([self._base_track()], timestamp_ms=12050)

        self.assertEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["severity"], "critical")


if __name__ == "__main__":
    unittest.main()
