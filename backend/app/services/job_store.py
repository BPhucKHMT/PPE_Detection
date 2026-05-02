from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import uuid


@dataclass
class JobRecord:
    video_path: str
    cancel: bool = False


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, JobRecord] = {}

    def create(self, video_path: str) -> str:
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = JobRecord(video_path=video_path)
        return job_id

    def get(self, job_id: str) -> JobRecord | None:
        return self._jobs.get(job_id)

    def cancel(self, job_id: str) -> None:
        job = self._jobs.get(job_id)
        if job is not None:
            job.cancel = True

    def pop(self, job_id: str) -> JobRecord | None:
        return self._jobs.pop(job_id, None)


job_store = JobStore()
