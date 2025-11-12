import os
import sys

sys.path.append("..")

from .ortophoto import Ortophoto

from ..data.ortophoto_analyser import OrtophotoAnalyser
from ..models.predict_model import OrtophotoInference
from ..utility.utils import logger_setup
from ..settings.project_settings import LOG_TO_FILE

"""
Este módulo contém a rotina a ser executada após um arquivo de ortomosaico ser
inserido no sistema.

A rotina consiste em:
1 - Ler o arquivo de Ortomosaico
2 - Extrair e salvar composições e índices de vegetação
3 - Extrair e salvar a máscara de segmentação
4 - Extrair e salarm métricas de avaliação
"""

logger = logger_setup(to_file=LOG_TO_FILE)


def main(directory, filename="ortophoto.tif", structure_id=None, inspection_id=None):
    print(filename)
    print(directory)
    path = os.path.join(directory, filename)
    print(path)
    logger.info(f"Importação de novo Ortomosaico: {path}")

    Ortophoto(input_path=path, output_path=directory)
    OrtophotoInference(ortophoto_path=path, output_path=directory)
    OrtophotoAnalyser(structure_id=structure_id, name=filename, inspection_id=inspection_id, directory=directory)


if __name__ == "__main__":
    input("Input directory:")
    input("File name:")
    main()
