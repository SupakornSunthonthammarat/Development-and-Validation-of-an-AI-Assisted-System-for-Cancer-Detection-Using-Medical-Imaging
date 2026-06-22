from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from oncovision_ai.types import BoundingBox, ClassificationResult, DetectionResult, ProcessedImage, RenderedArtifacts, SegmentationResult


class OverlayGenerator:
    def generate(
        self,
        processed: ProcessedImage,
        overlay_path: Path,
        classification: ClassificationResult,
        detections: DetectionResult,
        segmentation: SegmentationResult,
    ) -> RenderedArtifacts:
        overlay_path.parent.mkdir(parents=True, exist_ok=True)

        overlay_image = self._render_overlay(processed.rgb, segmentation.masks)
        annotated_image = self._render_annotations(processed.rgb, classification, detections.boxes)

        overlay_pil = Image.fromarray(overlay_image)
        annotated_pil = Image.fromarray(annotated_image)

        annotated_path = overlay_path.with_name(overlay_path.name.replace("-overlay", "-annotated"))
        overlay_pil.save(overlay_path)
        annotated_pil.save(annotated_path)

        mask_paths: list[Path] = []
        for index, mask in enumerate(segmentation.masks):
            mask_path = overlay_path.with_name(overlay_path.name.replace("-overlay", f"-mask-{index}"))
            Image.fromarray(mask).save(mask_path)
            mask_paths.append(mask_path)

        metadata_path = overlay_path.with_name(overlay_path.name.replace("-overlay.png", "-artifacts.json"))
        metadata_path.write_text(
            json.dumps(
                {
                    "bounding_boxes": [self._box_to_dict(box) for box in detections.boxes],
                    "segmentation_mask_paths": [str(path) for path in mask_paths],
                    "annotated_image_path": str(annotated_path),
                    "engine": {
                        "classifier": classification.source_model,
                        "detector": detections.source_model,
                        "segmenter": segmentation.source_model,
                    },
                },
                indent=2,
            ),
            encoding="utf-8",
        )

        return RenderedArtifacts(
            overlay_path=overlay_path,
            annotated_image_path=annotated_path,
            segmentation_mask_paths=mask_paths,
        )

    def _render_overlay(self, rgb: np.ndarray, masks: list[np.ndarray]) -> np.ndarray:
        canvas = rgb.copy()
        for mask in masks:
            if mask.shape[:2] != canvas.shape[:2]:
                continue
            tint = np.zeros_like(canvas)
            tint[:, :, 0] = 14
            tint[:, :, 1] = 165
            tint[:, :, 2] = 233
            binary_mask = mask > 0
            canvas[binary_mask] = cv2.addWeighted(canvas, 0.45, tint, 0.55, 0)[binary_mask]
        return canvas

    def _render_annotations(self, rgb: np.ndarray, classification: ClassificationResult, boxes: list[BoundingBox]) -> np.ndarray:
        canvas = cv2.cvtColor(rgb.copy(), cv2.COLOR_RGB2BGR)
        for box in boxes:
            cv2.rectangle(canvas, (box.x_min, box.y_min), (box.x_max, box.y_max), (0, 180, 255), 2)
            label = f"{box.label} {round(box.confidence * 100)}%"
            cv2.putText(canvas, label, (box.x_min, max(24, box.y_min - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 180, 255), 2)
        header = f"{classification.label} {round(classification.confidence * 100)}%"
        cv2.putText(canvas, header, (18, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        return cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)

    def _box_to_dict(self, box: BoundingBox) -> dict[str, int | float | str]:
        return {
            "label": box.label,
            "confidence": box.confidence,
            "x_min": box.x_min,
            "y_min": box.y_min,
            "x_max": box.x_max,
            "y_max": box.y_max,
        }
