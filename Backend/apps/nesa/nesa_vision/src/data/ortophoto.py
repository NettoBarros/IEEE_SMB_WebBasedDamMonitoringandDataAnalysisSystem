import os
import sys
import cv2
import numpy as np
import tifffile
import matplotlib.pyplot as plt
import matplotlib.cm as cm

sys.path.append("..")

from ..utility.utils import create_directory
from ..settings.project_settings import SEGMENTATION_CLASSES


# ---------------------------------------------------------------------------- #
#                             Classe de Ortophotos                             #
# ---------------------------------------------------------------------------- #

"""
A classe `Ortophoto` representa um arquivo de Ortomosaico, que é um conjunto de 
imagens aéreas georreferenciadas que foram unidas para formar uma única imagem.
"""


class Ortophoto:
    """
    Classe responsável por carregar e manipular arquivos de ortomosaico.

    Parâmetros
        ----------
        path : str
            diretório do arquivo de ortomosaico em formato .tif.
    """

    def __init__(self, input_path, output_path=None):
        # Carrega ortomosaico em formato .tif
        self.path = input_path
        self.tensor = self._load_tiff()

        # Salva dimensões da imagem
        self.height = self.tensor.shape[0]
        self.width = self.tensor.shape[1]
        self.shape = (self.height, self.width)

        # Separa as bandas espectrais
        self.red = self._correct_bands(self.tensor[:, :, 0])
        self.green = self._correct_bands(self.tensor[:, :, 1])
        self.blue = self._correct_bands(self.tensor[:, :, 2])
        self.rededge = self._correct_bands(self.tensor[:, :, 3])
        self.nir = self._correct_bands(self.tensor[:, :, 4])

        # Tensor contendo as bandas espectrais (sem cutline)
        self.ms_tensor = self.tensor[:, :, :5]

        # Separa a linha de corte
        # O arquivo gerado pelo OpenDroneMap acompanha uma linha de corte que
        # é armazenada no canal 5 do tensor. A linha de corte é uma máscara binária
        self.cutline = np.uint8(
            (self.tensor[:, :, 5] - np.min(self.tensor[:, :, 5]))
            / (np.max(self.tensor[:, :, 5]) - np.min(self.tensor[:, :, 5]))
        )
        self.cutline = self.cutline.astype(bool)

        # Salva os arquivos de saída
        if output_path is not None:
            self.save_indexes_as_png(output_path)

    def _correct_bands(self, tensor):
        """
        Corrige possíveis valores fora do intervalor correto [0, 1].
        """
        tensor[np.where(tensor > 1)] = 1
        tensor[np.where(tensor < 0)] = 0
        return tensor

    def _load_tiff(self):
        """
        Carregamento do arquivo de imagem em formato .tif.
        """

        print("--------------------------", self.path)
        assert os.path.isfile(self.path), f"{self.path} does not exist"

        extensions = ["tif"]
        extension = self.path.split(".")[-1]

        assert extension in extensions

        ortophoto = tifffile.imread(self.path)
        return ortophoto

    def _normalize(self, im, min=None, max=None):
        """
        Normalização de imagem. Adaptado de Micasense Image Processing
        (https://github.com/micasense/imageprocessing)
        """
        width, height = im.shape
        norm = np.zeros((width, height), dtype=np.float32)
        if min is not None and max is not None:
            norm = (im - min) / (max - min)
        else:
            cv2.normalize(
                im,
                dst=norm,
                alpha=0.0,
                beta=1.0,
                norm_type=cv2.NORM_MINMAX,
                dtype=cv2.CV_32F,
            )
        norm[norm < 0.0] = 0.0
        norm[norm > 1.0] = 1.0
        return norm

    def _normalized_stack(self, array):
        """
        Normalização de stack. Adaptado de Micasense Image Processing
        (https://github.com/micasense/imageprocessing)
        """
        im_display = np.zeros(
            (array.shape[0], array.shape[1], array.shape[2]), dtype=np.float32
        )

        im_min = np.percentile(
            array[:, :, :].flatten(), 0.5
        )  # modify these percentiles to adjust contrast
        im_max = np.percentile(
            array[:, :, :].flatten(), 99.5
        )  # for many images, 0.5 and 99.5 are good values

        # for rgb true color, we use the same min and max scaling across the 3 bands to
        # maintain the "white balance" of the calibrated image
        for i in range(array.shape[-1]):
            im_display[:, :, i] = self._normalize(array[:, :, i], im_min, im_max)

        return im_display

    def get_bgr(self):
        """
        Retorna a imagem composta pelas bandas BGR.
        """
        bgr = [self.blue, self.green, self.red]

        bgr = np.moveaxis(bgr, 0, -1)
        bgr = self._normalized_stack(bgr)

        return bgr

    def get_rgb(self):
        """
        Retorna a imagem composta pelas bandas RGB.
        """
        rgb = [self.red, self.green, self.blue]
        rgb = np.moveaxis(rgb, 0, -1)

        return self._normalized_stack(rgb)

    def get_gray(self):
        """
        Retorna a imagem em escala de cinza.
        """
        bgr = self.get_bgr()
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        gray = gray * 255

        return gray.astype(int)

    def get_cir(self):
        """
        Retorna a imagem em composição falsa-cor.
        """
        cir = [self.nir, self.red, self.green]
        cir = np.moveaxis(cir, 0, -1)

        return self._normalized_stack(cir)

    def get_ndvi(self):
        """
        Retorna o índice de vegetação NDVI.
        """
        with np.errstate(divide="ignore", invalid="ignore"):
            ndvi = (self.nir - self.red) / (self.nir + self.red)
            ndvi[np.isnan(ndvi)] = 0
            ndvi = np.clip(ndvi, -1, 1)
            return ndvi * (self.cutline > 0)

    def get_gndvi(self):
        """
        Retorna o índice de vegetação GNDVI
        """
        with np.errstate(divide="ignore", invalid="ignore"):
            gndvi = (self.nir - self.green) / (self.nir + self.green)
            gndvi[np.isnan(gndvi)] = 0
            gndvi = np.clip(gndvi, -1, 1)
            return gndvi * (self.cutline > 0)

    def get_ndre(self):
        """
        Retorna o índice de vegetação NDRE.
        """
        with np.errstate(divide="ignore", invalid="ignore"):
            ndre = (self.rededge - self.red) / (self.rededge + self.red)
            ndre[np.isnan(ndre)] = 0
            ndre = np.clip(ndre, -1, 1)
            return ndre * (self.cutline > 0)

    def get_ndwi(self):
        """
        Retorna o índice de vegetação NDWI.
        """
        with np.errstate(divide="ignore", invalid="ignore"):
            ndwi = (self.green - self.nir) / (self.green + self.nir)
            ndwi[np.isnan(ndwi)] = 0
            ndwi = np.clip(ndwi, -1, 1)
            return ndwi * (self.cutline > 0)

    def get_gci(self):
        """
        Retorna o índice de vegetação GCI.
        """
        with np.errstate(divide="ignore", invalid="ignore"):
            gci = (self.nir / self.green) - 1
            gci[np.isnan(gci)] = 0
            gci = np.clip(gci, -1, 1)
            return gci * (self.cutline > 0)

    def apply_colormap(self, index, vmin, vmax):
        """
        Aplica um mapa de cores a um índice de vegetação.
        """
        norm = plt.Normalize(vmin, vmax)
        colormap = cm.RdYlGn
        mapped = colormap(norm(index))
        mapped[:, :, 3] = self.cutline
        return mapped

    def save_indexes_as_png(self, save_path):
        """
        Salva as composições e índices de vegetação em formato .png.
        """
        create_directory(save_path)

        plt.imsave(f"{save_path}/rgb.png", self.get_rgb())
        plt.imsave(f"{save_path}/cir.png", self.get_cir())
        plt.imsave(
            f"{save_path}/ndvi.png",
            self.apply_colormap(self.get_ndvi(), vmin=-1, vmax=1),
        )
        plt.imsave(
            f"{save_path}/gndvi.png",
            self.apply_colormap(self.get_gndvi(), vmin=-1, vmax=1),
        )
        plt.imsave(
            f"{save_path}/ndre.png",
            self.apply_colormap(self.get_ndre(), vmin=-1, vmax=1),
        )
        plt.imsave(
            f"{save_path}/ndwi.png",
            self.apply_colormap(self.get_ndwi(), vmin=-1, vmax=1),
        )
