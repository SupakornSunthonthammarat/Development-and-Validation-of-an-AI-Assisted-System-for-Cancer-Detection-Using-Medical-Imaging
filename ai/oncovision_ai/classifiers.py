from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from oncovision_ai.base import BaseModel
from oncovision_ai.types import ClassificationResult, ProcessedImage


class VGG16BoneCancerClassifier(BaseModel):
    def __init__(self, weights_path: Path | None = None) -> None:
        super().__init__("VGG16BoneCancerClassifier", weights_path=weights_path)
        self._model = None
        self._load_error: str | None = None

    def load(self) -> None:
        if self.is_loaded:
            return

        if self.weights_path is None or not self.weights_path.exists():
            self._load_error = "VGG16 checkpoint file was not found"
            return

        try:
            from tensorflow.keras.models import load_model  # type: ignore
        except Exception as exc:  # pragma: no cover - environment dependent
            self._load_error = f"TensorFlow/Keras unavailable: {exc}"
            return

        self._model = load_model(self.weights_path)
        self._loaded = True

    def classify(self, processed: ProcessedImage) -> ClassificationResult:
        self.load()
        if self.is_loaded and self._model is not None:
            probabilities = self._predict_with_checkpoint(processed)
            label = max(probabilities, key=probabilities.get)
            confidence = probabilities[label]
            return ClassificationResult(
                label=label,
                confidence=confidence,
                probabilities=probabilities,
                source_model=self.name,
                notes=f"Loaded checkpoint from {self.weights_path}",
            )

        return self._heuristic_fallback(processed)

    def _predict_with_checkpoint(self, processed: ProcessedImage) -> dict[str, float]:
        probabilities = self._model.predict(processed.classifier_input, verbose=0)[0]
        malignant_score = float(probabilities[0])
        normal_score = float(probabilities[1]) if len(probabilities) > 1 else 1.0 - malignant_score
        total = max(malignant_score + normal_score, 1e-6)
        return {
            "malignant": malignant_score / total,
            "normal": normal_score / total,
        }

    def _heuristic_fallback(self, processed: ProcessedImage) -> ClassificationResult:
        gray = processed.grayscale
        contrast = float(gray.std()) / 255.0
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float((edges > 0).mean())
        malignant_score = min(0.97, max(0.08, 0.35 + contrast * 0.7 + edge_density * 0.9))
        normal_score = 1.0 - malignant_score
        label = "malignant" if malignant_score >= normal_score else "normal"
        probabilities = {"malignant": malignant_score, "normal": normal_score}
        confidence = probabilities[label]
        load_note = self._load_error or "Checkpoint fallback used"
        return ClassificationResult(
            label=label,
            confidence=confidence,
            probabilities=probabilities,
            source_model=f"{self.name}-fallback",
            notes=load_note,
        )
