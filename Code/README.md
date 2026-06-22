# OncoVision AI

OncoVision AI is a production-oriented starter for an AI-assisted medical imaging research platform. It supports image upload, modular inference, visual overlay generation, report download, and a disabled-by-default assistant surface.

Important: this app is for research and education only. It is not a medical diagnosis tool, clinical decision support system, or treatment recommendation system.

The assistant never diagnoses directly from images. It only receives structured pipeline outputs such as finding label, confidence percentage, modality, and optional location metadata.

## Modular Inference Engine

The AI layer now uses interchangeable components:

- `BaseModel`
- `ImageProcessor`
- `VGG16BoneCancerClassifier`
- `YOLODetector`
- `UNetSegmenter`
- `OverlayGenerator`
- `InferencePipeline`

The pipeline returns:

- prediction
- confidence
- bounding boxes
- segmentation masks
- overlay image
- annotated image

The current classifier attempts to use the VGG16 `.h5` checkpoint from `.agents/bone-cancer-classifier/our-model.h5` when TensorFlow/Keras is available. In the current Python 3.13 environment, TensorFlow is not installed, so the pipeline falls back to a deterministic research heuristic while preserving the same component interfaces.

## Stack

- Frontend: Next.js 15, React, TypeScript, Tailwind CSS, shadcn-style UI, React Hook Form, Zustand, Framer Motion
- Backend: FastAPI, Python 3.12, Pydantic, SQLAlchemy, Alembic-ready structure
- AI: PyTorch/MONAI/YOLO-ready interfaces, OpenCV, Pillow, NumPy placeholder pipeline
- Database: PostgreSQL
- Deployment: Docker and Docker Compose

## Folder Structure

```text
frontend/   Next.js application
backend/    FastAPI application
ai/         Placeholder inference package and future model interfaces
database/   Schema reference and migration notes
docs/       Architecture notes
```

## Run with Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

## Publish Online

See `docs/deployment.md` for production deployment steps. In short, you need a VPS or cloud host, public domain, HTTPS reverse proxy, and production environment variables.

## Run Locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set PYTHONPATH=..\ai;.
uvicorn app.main:app --reload
```

Create `frontend/.env.local` from `frontend/.env.example` and `backend/.env` from `backend/.env.example` when running outside Docker.

## Google Login

Create a Google OAuth web client in Google Cloud Console and add these values:

Frontend `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Backend `.env`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OPENAI_API_KEY=your-server-side-openai-api-key
OPENAI_MODEL=gpt-5.5
```

For local development, add `http://localhost:3000` as an authorized JavaScript origin in the Google OAuth client.

## API

- `POST /api/register`
- `POST /api/login`
- `POST /api/auth/google`
- `POST /api/upload`
- `POST /api/predict`
- `GET /api/history`
- `GET /api/report/{id}`
- `POST /api/analysis/{id}/explanation`
- `POST /api/chat`

`POST /api/chat` now requires an `analysis_id` so the assistant can answer from structured findings rather than raw images.

## Future AI Integration

Swap the current classifier, detector, or segmenter with validated checkpoints that:

- Load trained PyTorch, MONAI, YOLO, or TensorFlow weights.
- Perform modality-specific preprocessing and normalization.
- Return calibrated confidence scores.
- Generate clinically reviewed explainability artifacts.
- Are validated against approved datasets and reviewed by qualified clinicians before any clinical consideration.
