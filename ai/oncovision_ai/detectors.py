from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from oncovision_ai.base import BaseModel
from oncovision_ai.types import BoundingBox, ClassificationResult, DetectionResult, ProcessedImage


class YOLODetector(BaseModel):
    def __init__(self, weights_path: Path | None = None) -> None:
        super().__init__("YOLODetector", weights_path=weights_path)
        self._model = None
        self._load_error: str | None = None

    def load(self) -> None:
        if self.is_loaded or self.weights_path is None or not self.weights_path.exists():
            return
        try:
            from ultralytics import YOLO  # type: ignore
        except Exception as exc:  # pragma: no cover - environment dependent
            self._load_error = f"Ultralytics unavailable: {exc}"
            return
        self._model = YOLO(str(self.weights_path))
        self._loaded = True

    def detect(self, processed: ProcessedImage, classification: ClassificationResult) -> DetectionResult:
        self.load()
        if self.is_loaded and self._model is not None:
            try:
                return self._detect_with_yolo(processed)
            except Exception as exc:  # pragma: no cover - runtime dependent
                self._load_error = f"YOLO inference failed: {exc}"
        return self._heuristic_detection(processed, classification)

    def _detect_with_yolo(self, processed: ProcessedImage) -> DetectionResult:
        result = self._model.predict(source=processed.rgb, verbose=False)[0]
        boxes: list[BoundingBox] = []
        for box in result.boxes:
            x_min, y_min, x_max, y_max = [int(value) for value in box.xyxy[0].tolist()]
            confidence = float(box.conf[0].item())
            label_index = int(box.cls[0].item())
            label = result.names.get(label_index, f"class-{label_index}")
            boxes.append(BoundingBox(label=label, confidence=confidence, x_min=x_min, y_min=y_min, x_max=x_max, y_max=y_max))
        return DetectionResult(boxes=boxes, source_model=self.name, notes=f"Loaded detector from {self.weights_path}")

    def _heuristic_detection(self, processed: ProcessedImage, classification: ClassificationResult) -> DetectionResult:
        gray = processed.grayscale
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, threshold = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        image_area = processed.width * processed.height
        candidate_boxes: list[BoundingBox] = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h
            if area < image_area * 0.02:
                continue
            candidate_boxes.append(
                BoundingBox(
                    label=f"possible_{classification.label}_region",
                    confidence=min(0.95, max(0.35, classification.confidence * 0.9)),
                    x_min=x,
                    y_min=y,
                    x_max=x + w,
                    y_max=y + h,
                )
            )

        if not candidate_boxes:
            box_width = max(80, processed.width // 3)
            box_height = max(80, processed.height // 3)
            left = (processed.width - box_width) // 2
            top = (processed.height - box_height) // 2
            candidate_boxes.append(
                BoundingBox(
                    label=f"possible_{classification.label}_region",
                    confidence=min(0.9, max(0.4, classification.confidence * 0.85)),
                    x_min=left,
                    y_min=top,
                    x_max=left + box_width,
                    y_max=top + box_height,
                )
            )

        return DetectionResult(
            boxes=candidate_boxes[:3],
            source_model=f"{self.name}-heuristic",
            notes=self._load_error or "Heuristic detector used because YOLO weights were not configured",
        )
