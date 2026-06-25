from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import Analysis, ChatHistory, Report, User
from app.schemas import (
    AdminOverviewResponse,
    AdminUserRow,
    AnalysisResponse,
    AuthRequest,
    BatchPredictRequest,
    BatchUploadResponse,
    ChatRequest,
    ChatResponse,
    GoogleAuthRequest,
    MemoryClearResponse,
    MeResponse,
    PredictRequest,
    RegisterRequest,
    TokenResponse,
    UploadResponse,
)
from app.services.ai_service import ai_service
from app.services.chat import generate_chat_reply
from app.services.cleanup import clear_user_ai_memory
from app.services.openai_responses import StructuredFinding
from app.services.reporting import build_report
from app.services.storage import storage

router = APIRouter()
upload_index: dict[str, dict[str, str]] = {}


def analysis_response(analysis: Analysis) -> AnalysisResponse:
    artifacts = ai_service.load_artifacts(Path(analysis.overlay_path))
    return AnalysisResponse(
        id=analysis.id,
        image_url=storage.url_for(Path(analysis.image_path)),
        overlay_url=storage.url_for(Path(analysis.overlay_path)),
        annotated_image_url=storage.url_for(Path(str(artifacts.get("annotated_image_path", analysis.overlay_path)))),
        segmentation_mask_urls=[
            storage.url_for(Path(mask_path)) for mask_path in artifacts.get("segmentation_mask_paths", [])
        ],
        bounding_boxes=artifacts.get("bounding_boxes", []),
        prediction=analysis.prediction,
        confidence=analysis.confidence,
        modality=analysis.modality,
        explanation=analysis.explanation,
        engine={key: str(value) for key, value in dict(artifacts.get("engine", {})).items()},
        created_at=analysis.created_at,
    )


def structured_finding_from_analysis(analysis: Analysis) -> StructuredFinding:
    return StructuredFinding(
        finding=analysis.prediction,
        confidence=analysis.confidence,
        modality=analysis.modality,
        pipeline_explanation=analysis.explanation,
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(name=payload.name, email=payload.email.lower(), hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: AuthRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/auth/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    try:
        claims = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google credential") from exc

    email = str(claims.get("email", "")).lower()
    email_verified = bool(claims.get("email_verified"))
    name = str(claims.get("name") or email.split("@")[0] or "Google user")

    if not email or not email_verified:
        raise HTTPException(status_code=401, detail="Google email is not verified")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(name=name, email=email, hashed_password=hash_password(f"google-oauth:{claims.get('sub')}"))
        db.add(user)
        db.commit()
        db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/upload", response_model=UploadResponse)
def upload_image(
    file: UploadFile = File(...),
    modality: str = Form(...),
    user: User = Depends(get_current_user),
) -> UploadResponse:
    if modality not in {"MRI", "CT", "X-ray", "Mammogram"}:
        raise HTTPException(status_code=400, detail="Unsupported modality")
    upload_id, path = storage.save_upload(file)
    upload_index[upload_id] = {"path": str(path), "modality": modality, "user_id": user.id}
    return UploadResponse(upload_id=upload_id, image_url=storage.url_for(path))


@router.post("/upload/batch", response_model=BatchUploadResponse)
def upload_images(
    files: list[UploadFile] = File(...),
    modality: str = Form(...),
    user: User = Depends(get_current_user),
) -> BatchUploadResponse:
    if modality not in {"MRI", "CT", "X-ray", "Mammogram"}:
        raise HTTPException(status_code=400, detail="Unsupported modality")
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")

    saved_uploads = storage.save_uploads(files)
    uploads = []
    for file, (upload_id, path) in zip(files, saved_uploads, strict=False):
        upload_index[upload_id] = {"path": str(path), "modality": modality, "user_id": user.id}
        uploads.append(
            {
                "upload_id": upload_id,
                "image_url": storage.url_for(path),
                "filename": file.filename or path.name,
            }
        )
    return BatchUploadResponse(uploads=uploads)


@router.post("/predict", response_model=AnalysisResponse)
def predict(payload: PredictRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AnalysisResponse:
    upload = upload_index.get(payload.upload_id)
    if upload is None or upload["user_id"] != user.id:
        raise HTTPException(status_code=404, detail="Upload not found")

    result = ai_service.analyze(Path(upload["path"]), payload.upload_id)
    analysis = Analysis(
        user_id=user.id,
        image_path=upload["path"],
        overlay_path=str(result["overlay_path"]),
        modality=upload["modality"],
        prediction=str(result["prediction"]),
        confidence=float(result["confidence"]),
        explanation=str(result["explanation"]),
    )
    db.add(analysis)
    db.flush()

    artifacts = ai_service.load_artifacts(Path(str(result["overlay_path"])))
    report = Report(analysis_id=analysis.id, content=build_report(analysis, artifacts))
    db.add(report)
    db.commit()
    db.refresh(analysis)
    upload_index.pop(payload.upload_id, None)
    return analysis_response(analysis)


@router.post("/predict/batch", response_model=list[AnalysisResponse])
def predict_batch(
    payload: BatchPredictRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AnalysisResponse]:
    analyses: list[AnalysisResponse] = []

    for upload_id in payload.upload_ids:
        upload = upload_index.get(upload_id)
        if upload is None or upload["user_id"] != user.id:
            raise HTTPException(status_code=404, detail=f"Upload not found: {upload_id}")

        result = ai_service.analyze(Path(upload["path"]), upload_id)
        analysis = Analysis(
            user_id=user.id,
            image_path=upload["path"],
            overlay_path=str(result["overlay_path"]),
            modality=upload["modality"],
            prediction=str(result["prediction"]),
            confidence=float(result["confidence"]),
            explanation=str(result["explanation"]),
        )
        db.add(analysis)
        db.flush()

        artifacts = ai_service.load_artifacts(Path(str(result["overlay_path"])))
        report = Report(analysis_id=analysis.id, content=build_report(analysis, artifacts))
        db.add(report)
        analyses.append(analysis_response(analysis))
        upload_index.pop(upload_id, None)

    db.commit()
    return analyses


@router.get("/history", response_model=list[AnalysisResponse])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AnalysisResponse]:
    analyses = db.scalars(
        select(Analysis).where(Analysis.user_id == user.id).order_by(Analysis.created_at.desc())
    ).all()
    return [analysis_response(item) for item in analyses]


@router.get("/report/{analysis_id}", response_class=PlainTextResponse)
def report(analysis_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> str:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None or analysis.user_id != user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")
    artifacts = ai_service.load_artifacts(Path(analysis.overlay_path))
    stored_report = db.scalar(select(Report).where(Report.analysis_id == analysis.id))
    return stored_report.content if stored_report else build_report(analysis, artifacts)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChatResponse:
    if not payload.analysis_id:
        raise HTTPException(status_code=400, detail="analysis_id is required so the consultant can use structured findings")

    analysis = db.get(Analysis, payload.analysis_id)
    if analysis is None or analysis.user_id != user.id:
        raise HTTPException(status_code=404, detail="Analysis not found")

    db.add(ChatHistory(user_id=user.id, role="user", content=payload.message))
    reply = generate_chat_reply(payload.message, payload.history, structured_finding_from_analysis(analysis))
    db.add(ChatHistory(user_id=user.id, role="assistant", content=reply))
    db.commit()
    return ChatResponse(reply=reply)


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        is_admin=user.email.lower() in set(settings.admin_emails),
    )


@router.get("/admin/overview", response_model=AdminOverviewResponse)
def admin_overview(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminOverviewResponse:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_analyses = db.scalar(select(func.count()).select_from(Analysis)) or 0
    total_chat_messages = db.scalar(select(func.count()).select_from(ChatHistory)) or 0

    analysis_counts = dict(
        db.execute(select(Analysis.user_id, func.count(Analysis.id)).group_by(Analysis.user_id)).all()
    )
    last_active = dict(
        db.execute(select(Analysis.user_id, func.max(Analysis.created_at)).group_by(Analysis.user_id)).all()
    )

    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    rows = [
        AdminUserRow(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
            analysis_count=int(analysis_counts.get(user.id, 0)),
            last_active=last_active.get(user.id),
        )
        for user in users
    ]

    return AdminOverviewResponse(
        total_users=total_users,
        total_analyses=total_analyses,
        total_chat_messages=total_chat_messages,
        users=rows,
    )


@router.delete("/memory", response_model=MemoryClearResponse)
def clear_memory(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MemoryClearResponse:
    summary = clear_user_ai_memory(db=db, user=user, upload_index=upload_index)
    return MemoryClearResponse(
        cleared_analyses=summary.cleared_analyses,
        cleared_chat_messages=summary.cleared_chat_messages,
        deleted_files=summary.deleted_files,
        cleared_pending_uploads=summary.cleared_pending_uploads,
    )
