from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Analysis, ChatHistory, User
from app.services.ai_service import ai_service
from app.services.storage import storage


@dataclass
class CleanupSummary:
    cleared_analyses: int = 0
    cleared_chat_messages: int = 0
    deleted_files: int = 0
    cleared_pending_uploads: int = 0


def _artifact_paths_for_analysis(analysis: Analysis) -> set[Path]:
    paths = {Path(analysis.image_path), Path(analysis.overlay_path)}
    artifacts = ai_service.load_artifacts(Path(analysis.overlay_path))
    annotated_image_path = artifacts.get("annotated_image_path")
    if annotated_image_path:
        paths.add(Path(str(annotated_image_path)))

    for mask_path in artifacts.get("segmentation_mask_paths", []):
        paths.add(Path(str(mask_path)))

    overlay_path = Path(analysis.overlay_path)
    metadata_path = overlay_path.with_name(overlay_path.name.replace("-overlay.png", "-artifacts.json"))
    paths.add(metadata_path)
    return paths


def clear_user_ai_memory(
    *,
    db: Session,
    user: User,
    upload_index: dict[str, dict[str, str]],
) -> CleanupSummary:
    analyses = db.scalars(select(Analysis).where(Analysis.user_id == user.id)).all()
    chat_messages = db.scalars(select(ChatHistory).where(ChatHistory.user_id == user.id)).all()

    file_paths: set[Path] = set()
    for analysis in analyses:
        file_paths.update(_artifact_paths_for_analysis(analysis))

    pending_upload_ids = [
        upload_id for upload_id, upload in upload_index.items() if upload.get("user_id") == user.id
    ]
    for upload_id in pending_upload_ids:
        upload = upload_index.pop(upload_id, None)
        if upload and upload.get("path"):
            file_paths.add(Path(upload["path"]))

    for message in chat_messages:
        db.delete(message)

    for analysis in analyses:
        db.delete(analysis)

    db.commit()

    deleted_files = 0
    for path in file_paths:
        if storage.delete_file(path):
            deleted_files += 1

    return CleanupSummary(
        cleared_analyses=len(analyses),
        cleared_chat_messages=len(chat_messages),
        deleted_files=deleted_files,
        cleared_pending_uploads=len(pending_upload_ids),
    )
