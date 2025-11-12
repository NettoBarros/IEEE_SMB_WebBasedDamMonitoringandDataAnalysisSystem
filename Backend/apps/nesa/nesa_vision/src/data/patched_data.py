import os
import tifffile
import sys

sys.path.append("..")

from ..data.ortophoto import Ortophoto
from ..data import patching as pt
from ..utility.utils import rgb_to_mask, logger_setup
from ..settings.project_settings import *

logger = logger_setup(to_file=LOG_TO_FILE)

"""
Comando no terminal para executar o script:

python patched_dataset.py --ortos_path="../../data/raw/ortophotos/" --masks_path="../../data/raw/masks/" --output_path="../../data/processed/"

Argumentos:
--ortos_path: Caminho para os ortomosaicos de entrada
--masks_path: Caminho para as máscaras de segmentação de entrada
--output_path: Caminho para salvar o dataset segmentado
"""


class ImagePatcher:
    """
    Classe Responsável pela segmentação de arquivo de imagem.
    As classes PatchedOrtophoto e PatchedMask herdam desta classe.
    """

    def __init__(self, path):
        self.path = path
        self.file_name, self.extension = self.retrieve_file_name()

    def retrieve_file_name(self):
        """
        Extrai o nome do arquivo de ortomosaico a partir do caminho do arquivo.
        """
        # Retrieve file name and extension from self.path
        file_name = os.path.basename(self.path).split(".")[0]
        extension = os.path.basename(self.path).split(".")[1]
        return file_name, extension

    def pad_tensor(self, tensor, patch_size=PATCH_SIZE):
        """
        Aplica padding ao tensor
        para que o mesmo seja divisível pelo tamanho do patch.
        """
        self.padded_shape = pt.get_padded_shape(tensor.shape, patch_size)
        return pt.pad_image(tensor, self.padded_shape)

    def create_patches(
        self, tensor, patch_size=PATCH_SIZE, step_size=INFERENCE_STEP_SIZE
    ):
        """
        Utiliza a biblioteca Patchify para gerar segmentos de um tensor.
        Retorna o tensor contendo os segmentos.
        """
        shape = (patch_size, patch_size, tensor.shape[2])
        patches = pt.create_patches(tensor, shape, step_size)
        logger.info(
            f"Dividido em {len(patches[0])} patches. Tamanho: {patch_size}x{patch_size}. Step: {step_size}."
        )
        return patches


class OrtophotoPatcher(ImagePatcher):
    """
    Classe Responsável pela segmentação de arquivo de Ortomosaico.
    Configurações de patching são definidas em settings/project_settings.py.
    Retorna os segmentos do ortomosaico e o nome do arquivo.
    """

    def __init__(self, path):
        super().__init__(path)
        self.make_patched_dataset()

    def retrieve_ortophoto(self):
        """
        Carrega um ortomosaico, corrige o formato do tensor,
        adicionando a dimensão 3.
        """
        self.ortophoto = Ortophoto(self.path)
        tensor = self.ortophoto.ms_tensor
        tensor = pt.reshape_single_channel_matrix(tensor)
        logger.info(
            f"Ortomosaico Carregado: {self.file_name}. Formato: {tensor.shape}."
        )
        return tensor

    def make_patched_dataset(self):
        """
        Carrega ortomosaico, aplica padding para poder se ajustar ao
        tamanho do patch, cria os patches e retorna os segmentos.

        Returns
        -------
        patches :
            Segmentos do ortomosaico gerados pela biblioteca Patchify.
        file_name : str
            Nome do arquivo de ortomosaico.
        """
        tensor = self.retrieve_ortophoto()
        tensor_padded = self.pad_tensor(tensor)
        self.patches = self.create_patches(tensor_padded)
        return self.patches, self.file_name


class MaskPatcher(ImagePatcher):
    def __init__(self, path):
        super().__init__(path)
        self.make_patched_dataset()

    def retrieve_mask(self):
        """
        Carrega uma máscara de ortomosaico,
        corrige o formato do tensor, adicionando a dimensão 3.
        """
        tensor = tifffile.imread(self.path)
        tensor = rgb_to_mask(tensor)
        tensor = pt.reshape_single_channel_matrix(tensor)
        self.shape = tensor.shape

        logger.info(f"Máscara Carregada: {self.file_name}. Formato: {tensor.shape}.")

        return tensor

    def make_patched_dataset(self):
        """
        Carrega ortomosaico, aplica padding para poder se ajustar ao
        tamanho do patch, cria os patches e retorna os segmentos.

        Returns
        -------
        patches :
            Segmentos do ortomosaico gerados pela biblioteca Patchify.
        file_name : str
            Nome do arquivo de ortomosaico.
        """
        tensor = self.retrieve_mask()
        tensor_padded = self.pad_tensor(tensor)
        self.patches = self.create_patches(tensor_padded)
        return self.patches, self.file_name
