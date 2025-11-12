import os
import sys
import click
import tifffile
import joblib
import numpy as np
import matplotlib.pyplot as plt

from keras.models import load_model

sys.path.append("..")

from ..settings.project_settings import *
from ..data.patched_data import OrtophotoPatcher
from ..data import patching
from ..utility.utils import mask_to_rgb, logger_setup, create_directory

logger = logger_setup(to_file=LOG_TO_FILE)

# ---------------------------------------------------------------------------- #
#               Realização de Inferências com um Modelo Treinado               #
# ---------------------------------------------------------------------------- #

"""
Este script contém a classe SegmentOrtophoto, responsável por realizar a segmentação
semântica do arquivo de entrada em formato .tiff utilizando um modelo de U-NET treinado
e armazenado em formato .keras.

Para utilizar a classe SegmentOrtophoto, basta instanciá-la com o caminho para o arquivo
e o caminho para salvar o resultado da segmentação (opcional). O resultado é salvo em 
formato .tiff.

Exemplo em Python:
```python
segment_ortophoto = SegmentOrtophoto(ortophoto, output)
prediction = segment_ortophoto.prediction
```

Exemplo em linha de comando:
```bash
python3 predict_model.py --ortophoto ortophoto.tif --output predictions/
```
"""


class OrtophotoInference:
    """
    Classe responsável por realizar a segmentação semântica de um arquivo
    de ortomosaico em formato .tiff utilizando um modelo de U-NET treinado
    e armazenado em formato .keras.
    """

    def __init__(self, ortophoto_path, output_path=None, model_path=MODEL_PATH):
        self.model_path = model_path
        self.ortophoto_path = ortophoto_path
        self.output_path = output_path

        if SCALER is not None:
            self.scaler = joblib.load(f"apps/nesa/nesa_vision/models/{SCALER}")

        self.model = load_model(self.model_path, safe_mode=False, compile=False)
        self.predict_ortophoto()

        if self.output_path is not None:
            create_directory(self.output_path)
            self.save_predictions()

    def get_patches(self):
        """
        Divide o ortomosaico em segmentos, ou patches, para inferência.
        """
        patcher = OrtophotoPatcher(self.ortophoto_path)

        self.file_name = patcher.file_name
        self.ortophoto_shape = patcher.ortophoto.shape
        self.ortophoto_padded_shape = patcher.padded_shape
        self.cutline = patcher.ortophoto.cutline

        self.mask_patches_shape = list(patcher.patches.shape)
        self.mask_patches_shape[-1] = 1

        self.mask_padded_shape = list(self.ortophoto_padded_shape)
        self.mask_padded_shape[-1] = 1
        self.mask_padded_shape = tuple(self.mask_padded_shape)

        return patcher.patches

    def predict_patches(self):
        """
        Realiza a inferência de segmentação semântica em cada patch do ortomosaico.
        """
        pred_patches = np.zeros(self.mask_patches_shape)

        for x in range(self.patches.shape[0]):
            for y in range(self.patches.shape[1]):
                for z in range(self.patches.shape[2]):
                    patch = self.patches[x, y, z]
                    patch = patch[np.newaxis, :, :, :]
                    if SCALER is not None:
                        scaled_patch = self.scaler.transform(
                            patch.reshape(-1, patch.shape[-1])
                        )
                        scaled_patch = scaled_patch.reshape(patch.shape)
                    else:
                        scaled_patch = patch

                    pred = self.model.predict(scaled_patch).squeeze()
                    pred_patches[x, y, z] = pred.argmax(axis=-1)[:, :, np.newaxis]

        return pred_patches

    def apply_cutline(self, mask, cutline):
        """
        Aplica a linha de corte original ao resultado da segmentação.
        """
        return np.multiply(mask, cutline[:, :, np.newaxis])

    def rebuild_mask(self):
        """
        Reconstrói a máscara de segmentação a partir dos patches inferidos.
        """
        padded_ortophoto_mask = patching.stitch_image(
            self.prediction_patches, self.mask_padded_shape
        )
        prediction_mask = patching.undo_padding(
            padded_ortophoto_mask, self.ortophoto_shape
        )

        prediction_mask = self.apply_cutline(prediction_mask, self.cutline)

        return prediction_mask

    def save_predictions(self):
        """
        Salva as inferências em formato .tiff.
        """
        rgb_mask = mask_to_rgb(self.prediction)
        save_path = os.path.join(self.output_path, f"mask.tiff")
        tifffile.imwrite(save_path, rgb_mask)
        logger.info(f"Resultado salvo em {save_path}.")

    def predict_ortophoto(self):
        """
        Passos necessários para realizar a inferência de segmentação semântica
        em um ortomosaico.
        """
        logger.info("                                 ")
        logger.info("---> Previsão de Ortomosaico <---")
        logger.info(f"Arquivo: {self.ortophoto_path}")

        self.patches = self.get_patches()
        self.prediction_patches = self.predict_patches()
        self.prediction = self.rebuild_mask()

        return self.prediction


@click.command()
@click.option(
    "--ortophoto",
    default="../../data/sample/images/ortophoto.tif",
    required=True,
    help="Path to the ortophoto file",
)
@click.option(
    "--output",
    default="../../data/sample/predictions/",
    required=True,
    help="Path to save the predictions",
)
def predict_segmentation(ortophoto, output):
    segment_ortophoto = OrtophotoInference(ortophoto, output)
    plt.imshow(segment_ortophoto.prediction)


if __name__ == "__main__":
    predict_segmentation()
