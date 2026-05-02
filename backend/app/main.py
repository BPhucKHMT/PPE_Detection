from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.ws_routes import router as ws_router
from backend.app.core.config import DEVICE_LABEL
from backend.app.services.runtime_selector import MODEL_BACKEND, MODEL_PATH, get_runtime_info


def create_app() -> FastAPI:
    app = FastAPI(title="PPE Detection WS API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return get_runtime_info(MODEL_BACKEND, MODEL_PATH, DEVICE_LABEL)

    app.include_router(ws_router)
    return app


app = create_app()
