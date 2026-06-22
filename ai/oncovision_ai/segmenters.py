from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from oncovision_ai.base import BaseModel
from oncovision_ai.types import ClassificationResult, DetectionResult, ProcessedImage, SegmentationResult


class UNetSegmenter(BaseModel):
    def __init__(self, weights_path: Path | None = None) -> None:
        super().__init__("UNetSegmenter", weights_path=weights_path)
        self._model = None
        self._load_error: str | None = None

    def load(self) -> None:
        if self.is_loaded or self.weights_path is None or not self.weights_path.exists():
            return
        try:
            import torch
        except Exception as exc:  # pragma: no cover - environment dependent
            self._load_error = f"PyTorch unavailable: {exc}"
            return
        self._model = torch.load(self.weights_path, map_location="cpu")
        self._loaded = True

    def segment(
        self,
        processed: ProcessedImage,
        detections: DetectionResult,
        classification: ClassificationResult,
    ) -> SegmentationResult:
        del classification
        self.load()
        if self.is_loaded and self._model is not None:
            return self._segment_with_loaded_model(processed)
        return self._heuristic_segmentation(processed, detections)

    def _segment_with_loaded_model(self, processed: ProcessedImage) -> SegmentationResult:
        # A real UNet checkpoint can plug in here later without changing pipeline wiring.
        mask = np.zeros((processed.height, processed.width), dtype=np.uint8)
        return SegmentationResult(
            masks=[mask],
            source_model=self.name,
            notes=f"UNet checkpoint hook available at {self.weights_path}",
        )

    def _heuristic_segmentation(self, processed: ProcessedImage, detections: DetectionResult) -> SegmentationResult:
        masks: list[np.ndarray] = []
        gray = processed.grayscale
        equalized = cv2.equalizeHist(gray)

        for box in detections.boxes:
            region = equalized[box.y_min:box.y_max, box.x_min:box.x_max]
            if region.size == 0:
                continue
            _, region_mask = cv2.threshold(region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            full_mask = np.zeros((processed.height, processed.width), dtype=np.uint8)
            full_mask[box.y_min:box.y_max, box.x_min:box.x_max] = region_mask
            masks.append(full_mask)

        if not masks:
            masks.append(np.zeros((processed.height, processed.width), dtype=np.uint8))

        return SegmentationResult(
            masks=masks,
            source_model=f"{self.name}-heuristic",
            notes=self._load_error or "Heuristic segmentation used because UNet weights were not configured",
        )
