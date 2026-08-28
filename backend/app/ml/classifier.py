from __future__ import annotations

import hashlib
from pathlib import Path
from typing import TYPE_CHECKING, Any

from app.core.config import Settings
from app.core.exceptions import AppError

if TYPE_CHECKING:
    from PIL.Image import Image


class WasteClassifier:
    """Lazy ONNX classifier with an explicitly enabled development mock."""

    # Recylo trains with alphabetically sorted directory names. Keep this order
    # aligned with the upstream model's ten output neurons.
    RECYLO_CLASSES = (
        "hazardous_batteries",
        "hazardous_biomedical",
        "hazardous_e-waste",
        "hazardous_toxic-sharp",
        "non_recyclable",
        "organic",
        "recyclable_cardboard",
        "recyclable_metal",
        "recyclable_paper",
        "recyclable_plastic",
    )
    RECYLO_TO_CAMIDE = {
        "hazardous_batteries": "b3",
        "hazardous_biomedical": "b3",
        "hazardous_e-waste": "b3",
        "hazardous_toxic-sharp": "b3",
        "non_recyclable": "residual",
        "organic": "organic",
        "recyclable_cardboard": "inorganic",
        "recyclable_metal": "inorganic",
        "recyclable_paper": "inorganic",
        "recyclable_plastic": "inorganic",
    }

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.labels = settings.camide_labels
        self._session: Any = None

    def predict(self, image: Image, source_bytes: bytes) -> dict[str, Any]:
        if self.settings.camide_mock_classifier:
            return self._mock_prediction(source_bytes)
        return self._onnx_prediction(image)

    def _mock_prediction(self, source_bytes: bytes) -> dict[str, Any]:
        # Deterministic output keeps development and tests reproducible.
        index = hashlib.sha256(source_bytes).digest()[0] % len(self.labels)
        return {"category": self.labels[index], "confidence": 0.91}

    def _get_session(self) -> Any:
        model_path = Path(self.settings.camide_model_path)
        if not model_path.is_file():
            raise AppError(
                "MODEL_NOT_READY",
                "Waste classification model is not available",
                503,
            )
        if self._session is None:
            try:
                import onnxruntime as ort

                self._session = ort.InferenceSession(
                    str(model_path),
                    providers=["CPUExecutionProvider"],
                )
            except AppError:
                raise
            except Exception as exc:
                raise AppError("MODEL_LOAD_FAILED", "Waste classification model could not be loaded", 503) from exc
        return self._session

    def _onnx_prediction(self, image: Image) -> dict[str, Any]:
        try:
            session = self._get_session()
            import numpy as np

            resized = image.resize((224, 224))
            pixels = np.asarray(resized, dtype=np.float32) / 255.0
            if self.settings.camide_model_profile == "recylo_10class":
                tensor = pixels[None, ...]
            else:
                tensor = np.transpose(pixels, (2, 0, 1))[None, ...]
            output = np.asarray(session.run(None, {session.get_inputs()[0].name: tensor})[0]).squeeze()
        except AppError:
            raise
        except Exception as exc:
            raise AppError("MODEL_INFERENCE_FAILED", "Waste image could not be classified", 503) from exc

        expected_size = len(self.RECYLO_CLASSES) if self.settings.camide_model_profile == "recylo_10class" else len(self.labels)
        if output.ndim != 1 or output.size != expected_size:
            raise AppError(
                "MODEL_OUTPUT_INVALID",
                f"Waste classification model must output {expected_size} classes for the configured profile",
                503,
            )

        # Accept a probability vector; otherwise treat the output as logits.
        if not np.all(np.isfinite(output)):
            raise AppError("MODEL_OUTPUT_INVALID", "Waste classification model returned non-finite values", 503)
        if np.all(output >= 0) and np.all(output <= 1) and np.isclose(output.sum(), 1.0, atol=1e-3):
            probabilities = output
        else:
            stable = output - np.max(output)
            exponentials = np.exp(stable)
            probabilities = exponentials / exponentials.sum()

        if self.settings.camide_model_profile == "recylo_10class":
            grouped = {label: 0.0 for label in self.labels}
            for source_label, probability in zip(self.RECYLO_CLASSES, probabilities, strict=True):
                grouped[self.RECYLO_TO_CAMIDE[source_label]] += float(probability)
            category = max(grouped, key=grouped.get)
            return {"category": category, "confidence": grouped[category]}

        index = int(np.argmax(probabilities))
        return {"category": self.labels[index], "confidence": float(probabilities[index])}
