from __future__ import annotations

from dataclasses import dataclass
import uuid


@dataclass
class ViolationRecord:
    started_at_ms: int
    last_seen_ms: int
    missing_items: tuple[str, ...]
    state: str
    last_alert_at_ms: int | None = None


@dataclass
class TrackPPEMemory:
    helmet_missing_streak: int = 0
    vest_missing_streak: int = 0
    shoes_missing_streak: int = 0


class AlertEngine:
    def __init__(
        self,
        *,
        violation_threshold_ms: int,
        cooldown_ms: int,
        escalation_ms: int,
        min_track_age: int,
        min_track_hits: int,
    ) -> None:
        self.violation_threshold_ms = violation_threshold_ms
        self.cooldown_ms = cooldown_ms
        self.escalation_ms = escalation_ms
        self.min_track_age = min_track_age
        self.min_track_hits = min_track_hits
        self._track_state: dict[int, ViolationRecord] = {}
        self._track_ppe_memory: dict[int, TrackPPEMemory] = {}
        self.missing_streak_required = 3

    def evaluate_tracks(self, tracks: list[dict], *, timestamp_ms: int) -> tuple[list[dict], list[dict]]:
        alerts: list[dict] = []
        active_track_ids = set()
        updated_tracks: list[dict] = []

        for track in tracks:
            track_id = int(track["track_id"])
            active_track_ids.add(track_id)
            violation_missing = self._missing_items(track)

            if not violation_missing or not self._is_stable(track):
                self._track_state.pop(track_id, None)
                updated_tracks.append(self._with_violation(track, False, [], 0, "NORMAL"))
                continue

            record = self._track_state.get(track_id)
            if record is None:
                record = ViolationRecord(
                    started_at_ms=timestamp_ms,
                    last_seen_ms=timestamp_ms,
                    missing_items=violation_missing,
                    state="SUSPECTED_VIOLATION",
                    last_alert_at_ms=None,
                )
                self._track_state[track_id] = record
            else:
                record.last_seen_ms = timestamp_ms
                if record.missing_items != violation_missing:
                    record.missing_items = violation_missing

            duration_ms = max(0, timestamp_ms - record.started_at_ms)
            state = "SUSPECTED_VIOLATION"
            if duration_ms >= self.violation_threshold_ms:
                state = "CONFIRMED_VIOLATION"
            record.state = state

            updated_tracks.append(
                self._with_violation(
                    track,
                    True,
                    list(record.missing_items),
                    duration_ms,
                    state,
                )
            )

            if state == "CONFIRMED_VIOLATION" and self._can_emit(record, timestamp_ms):
                severity = "critical" if duration_ms >= self.escalation_ms else "high"
                code = "HELMET_NOT_WORN" if "helmet_not_worn" in record.missing_items else "PPE_MISSING_PERSISTENT"
                alerts.append(
                    {
                        "alert_id": str(uuid.uuid4()),
                        "track_id": track_id,
                        "severity": severity,
                        "code": code,
                        "message": self._build_message(track_id, record.missing_items, duration_ms),
                        "started_at_ms": record.started_at_ms,
                        "current_duration_ms": duration_ms,
                    }
                )
                record.last_alert_at_ms = timestamp_ms

        stale_ids = [track_id for track_id in self._track_state.keys() if track_id not in active_track_ids]
        for stale_id in stale_ids:
            self._track_state.pop(stale_id, None)
            self._track_ppe_memory.pop(stale_id, None)

        return updated_tracks, alerts

    def _is_stable(self, track: dict) -> bool:
        return int(track.get("age", 0)) >= self.min_track_age and int(track.get("hits", 0)) >= self.min_track_hits

    def _missing_items(self, track: dict) -> tuple[str, ...]:
        ppe_status = track.get("ppe_status", {})
        track_id = int(track.get("track_id", -1))
        memory = self._track_ppe_memory.setdefault(track_id, TrackPPEMemory())

        missing: list[str] = []

        helmet_missing_now = not ppe_status.get("helmet_worn", False)
        vest_missing_now = not ppe_status.get("safety_vest", False)
        shoes_missing_now = not ppe_status.get("shoes", False)

        memory.helmet_missing_streak = memory.helmet_missing_streak + 1 if helmet_missing_now else 0
        memory.vest_missing_streak = memory.vest_missing_streak + 1 if vest_missing_now else 0
        memory.shoes_missing_streak = memory.shoes_missing_streak + 1 if shoes_missing_now else 0

        if memory.helmet_missing_streak >= self.missing_streak_required:
            if ppe_status.get("helmet_present", False):
                missing.append("helmet_not_worn")
            else:
                missing.append("helmet")
        if memory.vest_missing_streak >= self.missing_streak_required:
            missing.append("safety_vest")
        if memory.shoes_missing_streak >= self.missing_streak_required:
            missing.append("shoes")

        return tuple(sorted(missing))

    def _can_emit(self, record: ViolationRecord, timestamp_ms: int) -> bool:
        if record.last_alert_at_ms is None:
            return True
        return (timestamp_ms - record.last_alert_at_ms) >= self.cooldown_ms

    @staticmethod
    def _with_violation(track: dict, is_violating: bool, missing_items: list[str], duration_ms: int, state: str) -> dict:
        enriched = dict(track)
        enriched["violation"] = {
            "is_violating": is_violating,
            "missing_items": missing_items,
            "duration_ms": duration_ms,
            "state": state,
        }
        return enriched

    @staticmethod
    def _build_message(track_id: int, missing_items: tuple[str, ...], duration_ms: int) -> str:
        display_items = ", ".join(missing_items)
        return f"Track #{track_id} vi phạm PPE ({display_items}) trong {duration_ms} ms"
