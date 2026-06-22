from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


class LocalStorage:
    def __init__(self, root: str) -> None:
        self.root = Path(root)
        self.uploads = self.root / "uploads"
        self.outputs = self.root / "outputs"
        self.reports = self.root / "reports"
        for path in (self.uploads, self.outputs, self.reports):
            path.mkdir(parents=True, exist_ok=True)

    def save_upload(self, file: UploadFile) -> tuple[str, Path]:
        suffix = Path(file.filename or "image.png").suffix or ".png"
        upload_id = str(uuid4())
        destination = self.uploads / f"{upload_id}{suffix}"
        with destination.open("wb") as buffer:
            copyfileobj(file.file, buffer)
        return upload_id, destination

    def save_uploads(self, files: list[UploadFile]) -> list[tuple[str, Path]]:
        return [self.save_upload(file) for file in files]

    def output_path(self, stem: str, suffix: str = ".png") -> Path:
        return self.outputs / f"{stem}{suffix}"

    def url_for(self, path: Path) -> str:
        relative = path.relative_to(self.root).as_posix()
        return f"/storage/{relative}"

    def delete_file(self, path: Path) -> bool:
        try:
            resolved = path.resolve(strict=False)
        except OSError:
            return False

        try:
            resolved.relative_to(self.root.resolve())
        except ValueError:
            return False

        if not resolved.exists() or not resolved.is_file():
            return False

        resolved.unlink(missing_ok=True)
        return True


storage = LocalStorage(settings.storage_root)
