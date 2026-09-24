import threading
from typing import Dict, Any, Optional

class JobStore:
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(
        self,
        job_id: str,
        input_type: str,
        input_content: str,
        user_email: str,
        solution_mode: str = "Full Explanation Mode",
        pdf_style: str = "Clean Academic",
        advanced_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        advanced_options = advanced_options or {}
        with self._lock:
            job = {
                "job_id": job_id,
                "status": "waiting",
                "progress_step": "input_received",
                "input_type": input_type,
                "input_content": input_content,
                "user_email": user_email,
                "solution_mode": solution_mode,
                "pdf_style": pdf_style,
                "advanced_options": advanced_options,
                "error": None,
                "result": None,
                "pdf_url": None,
                "final_state": None
            }
            self._jobs[job_id] = job
            return job

    def update_job(self, job_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(kwargs)
                return self._jobs[job_id]
            return None

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def list_jobs(self) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            return dict(self._jobs)

# Global job store instance
job_store = JobStore()
