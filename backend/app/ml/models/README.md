# CAMIDE model

CAMIDE supports two explicit ONNX profiles configured with
`CAMIDE_MODEL_PROFILE`:

- `camide_4class`: RGB float32 NCHW input `[1, 3, 224, 224]`, scaled to
  `0-1`, with four outputs matching `CAMIDE_MODEL_LABELS`.
- `recylo_10class`: RGB float32 NHWC input `[1, 224, 224, 3]`, scaled to
  `0-1`, with the Recylo model's ten alphabetically ordered subclasses.

The bundled `waste_classifier.onnx` is sourced from
[ishaaqdev/Recylo-SIH](https://github.com/ishaaqdev/Recylo-SIH) and used under
the MIT License. Its subclass probabilities are aggregated as follows:

- `hazardous_*` -> `b3`
- `non_recyclable` -> `residual`
- `organic` -> `organic`
- `recyclable_*` -> `inorganic`

Source file:
`https://github.com/ishaaqdev/Recylo-SIH/blob/main/ai/waste_model.onnx`

SHA-256:
`ECF1F4E8B3B11937A09E32CE2FB940C39877614DC2881C6D657245A9B8983DE8`

See `Recylo-SIH-LICENSE.txt` for the upstream copyright and license terms.
