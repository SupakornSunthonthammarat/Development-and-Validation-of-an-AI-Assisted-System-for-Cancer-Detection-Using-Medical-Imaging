# OncoVision AI Architecture

OncoVision AI is split into four replaceable layers:

- `frontend/`: Next.js 15 dashboard, upload workflow, results, assistant chat, and settings.
- `backend/`: FastAPI API, JWT auth, SQLAlchemy models, local storage, report generation, and chat placeholder.
- `ai/`: model pipeline interfaces and placeholder inference implementation.
- `database/`: schema reference and migration notes for PostgreSQL.

The current inference pipeline is intentionally simulated. It validates the end-to-end path from image upload to overlay/report generation without claiming clinical capability.

Future model integration should implement `ModelPipeline.run()` in `ai/oncovision_ai/pipeline.py`, then swap that implementation in `backend/app/services/ai_service.py`.
