from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class BoundingBox:
    label: str
    confidence: float
    x_min: int
    y_min: int
    x_max: int
    y_max: int


@dataclass(frozen=True)
class ClassificationResult:
    label: str
    confidence: float
    probabilities: dict[str, float]
    source_model: str
    notes: str = ""


@dataclass(frozen=True)
class DetectionResult:
    boxes: list[BoundingBox]
    source_model: str
    notes: str = ""


@dataclass(frozen=True)
class SegmentationResult:
    masks: list[np.ndarray]
    source_model: str
    notes: str = ""


@dataclass(frozen=True)
class ProcessedImage:
    image_path: Path
    pil_image: Image.Image
    rgb: np.ndarray
    grayscale: np.ndarray
    classifier_input: np.ndarray
    width: int
    height: int


@dataclass(frozen=True)
class RenderedArtifacts:
    overlay_path: Path
    annotated_image_path: Path
    segmentation_mask_paths: list[Path]


@dataclass(frozen=True)
class InferenceResult:
    prediction: str
    confidence: float
    explanation: str
    overlay_path: Path
    annotated_image_path: Path
    segmentation_mask_paths: list[Path]
    bounding_boxes: list[BoundingBox] = field(default_factory=list)
    engine: str = ""
    classifier_name: str = ""
    detector_name: str = ""
    segmenter_name: str = ""
