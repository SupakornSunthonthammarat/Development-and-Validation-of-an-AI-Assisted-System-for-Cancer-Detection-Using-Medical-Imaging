from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from oncovision_ai.types import ProcessedImage


class ImageProcessor:
    def __init__(self, classifier_size: tuple[int, int] = (224, 224), max_dimension: int = 1024) -> None:
        self.classifier_size = classifier_size
        self.max_dimension = max_dimension

    def load(self, image_path: Path) -> ProcessedImage:
        pil_image = Image.open(image_path).convert("RGB")
        pil_image.thumbnail((self.max_dimension, self.max_dimension))
        rgb = np.array(pil_image)
        grayscale = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        classifier_image = pil_image.resize(self.classifier_size)
        classifier_input = np.array(classifier_image).astype("float32") / 255.0
        classifier_input = np.expand_dims(classifier_input, axis=0)
        width, height = pil_image.size
        return ProcessedImage(
            image_path=image_path,
            pil_image=pil_image,
            rgb=rgb,
            grayscale=grayscale,
            classifier_input=classifier_input,
            width=width,
            height=height,
        )
