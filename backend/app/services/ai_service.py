import json
from pathlib import Path

from oncovision_ai.pipeline import InferencePipeline

from app.services.storage import storage


class AIService:
    def __init__(self) -> None:
        self.pipeline = InferencePipeline()

    def analyze(self, image_path: Path, upload_id: str) -> dict[str, str | float | list[dict[str, str | int | float]] | list[str]]:
        overlay_path = storage.output_path(f"{upload_id}-overlay")
        result = self.pipeline.run(image_path=image_path, overlay_path=overlay_path)
        return {
            "prediction": result.prediction,
            "confidence": result.confidence,
            "explanation": result.explanation,
            "overlay_path": str(overlay_path),
            "annotated_image_path": str(result.annotated_image_path),
            "segmentation_mask_paths": [str(path) for path in result.segmentation_mask_paths],
            "bounding_boxes": [
                {
                    "label": box.label,
                    "confidence": box.confidence,
                    "x_min": box.x_min,
                    "y_min": box.y_min,
                    "x_max": box.x_max,
                    "y_max": box.y_max,
                }
                for box in result.bounding_boxes
            ],
            "engine": result.engine,
            "classifier_name": result.classifier_name,
            "detector_name": result.detector_name,
            "segmenter_name": result.segmenter_name,
        }

    def load_artifacts(self, overlay_path: Path) -> dict[str, object]:
        metadata_path = overlay_path.with_name(overlay_path.name.replace("-overlay.png", "-artifacts.json"))
        if not metadata_path.exists():
            return {
                "annotated_image_path": str(overlay_path),
                "segmentation_mask_paths": [],
                "bounding_boxes": [],
                "engine": {},
            }
        return json.loads(metadata_path.read_text(encoding="utf-8"))


ai_service = AIService()
