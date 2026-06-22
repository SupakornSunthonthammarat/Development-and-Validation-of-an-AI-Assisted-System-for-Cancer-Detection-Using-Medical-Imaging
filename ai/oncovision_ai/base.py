from __future__ import annotations

from abc import ABC
from pathlib import Path


class BaseModel(ABC):
    """Shared base class for interchangeable inference components."""

    def __init__(self, name: str, weights_path: Path | None = None) -> None:
        self.name = name
        self.weights_path = weights_path
        self._loaded = False

    def load(self) -> None:
        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded
