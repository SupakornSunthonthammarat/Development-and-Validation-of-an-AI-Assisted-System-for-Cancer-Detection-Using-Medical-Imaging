from __future__ import annotations

from pathlib import Path
from typing import Protocol

from oncovision_ai.classifiers import VGG16BoneCancerClassifier
from oncovision_ai.detectors import YOLODetector
from oncovision_ai.image_processor import ImageProcessor
from oncovision_ai.overlay_generator import OverlayGenerator
from oncovision_ai.segmenters import UNetSegmenter
from oncovision_ai.types import InferenceResult


class ModelPipeline(Protocol):
    def run(self, image_path: Path, overlay_path: Path) -> InferenceResult:
        """Run preprocessing, classification, detection, segmentation, and rendering."""


class InferencePipeline:
    def __init__(
        self,
        classifier: VGG16BoneCancerClassifier | None = None,
        detector: YOLODetector | None = None,
        segmenter: UNetSegmenter | None = None,
        image_processor: ImageProcessor | None = None,
        overlay_generator: OverlayGenerator | None = None,
    ) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        default_vgg_checkpoint = repo_root / ".agents" / "bone-cancer-classifier" / "our-model.h5"

        self.classifier = classifier or VGG16BoneCancerClassifier(weights_path=default_vgg_checkpoint)
        self.detector = detector or YOLODetector()
        self.segmenter = segmenter or UNetSegmenter()
        self.image_processor = image_processor or ImageProcessor()
        self.overlay_generator = overlay_generator or OverlayGenerator()

    def run(self, image_path: Path, overlay_path: Path) -> InferenceResult:
        processed = self.image_processor.load(image_path)
        classification = self.classifier.classify(processed)
        detections = self.detector.detect(processed, classification)
        segmentation = self.segmenter.segment(processed, detections, classification)
        rendered = self.overlay_generator.generate(processed, overlay_path, classification, detections, segmentation)

        explanation = (
            f"Classification used {classification.source_model}; detection used {detections.source_model}; "
            f"segmentation used {segmentation.source_model}. "
            f"Classifier notes: {classification.notes or 'none'}. "
            f"Detector notes: {detections.notes or 'none'}. "
            f"Segmenter notes: {segmentation.notes or 'none'}."
        )

        prediction = "Possible malignant bone lesion" if classification.label == "malignant" else "No malignant bone pattern flagged"
        return InferenceResult(
            prediction=prediction,
            confidence=classification.confidence,
            explanation=explanation,
            overlay_path=rendered.overlay_path,
            annotated_image_path=rendered.annotated_image_path,
            segmentation_mask_paths=rendered.segmentation_mask_paths,
            bounding_boxes=detections.boxes,
            engine="modular-inference-pipeline",
            classifier_name=classification.source_model,
            detector_name=detections.source_model,
            segmenter_name=segmentation.source_model,
        )
