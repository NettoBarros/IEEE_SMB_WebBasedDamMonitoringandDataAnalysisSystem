import os
import sys
import tifffile
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from apps.nesa.models import Structure, Sensor, BoxPlot

sys.path.append("..")

from ..data.ortophoto import Ortophoto
from ..utility.utils import rgb_to_mask, logger_setup
from ..settings.project_settings import *

# ---------------------------------------------------------------------------- #
#                       Módulo de Análise de Ortomosaico                       #
# ---------------------------------------------------------------------------- #

"""
Este módulo contém a classe `OrtophotoAnalyser`, que é responsável por analisar
os arquivos de ortomosaico e gerar as métricas necessárias.

A classe assume que os seguintes arquivos estejam presentes no diretório de dados:
- Arquivo de Ortomosaico em formato .tif
- Arquivo de Máscara de Segmentação em formato .tiff

Resultados:
- Arquivo .csv contendo as estatísticas referentes a classe slope, usado para boxplot.
"""

logger = logger_setup(to_file=LOG_TO_FILE)


class OrtophotoAnalyser:
    """
    Gera os resultados numéricos das análises de ortomosaicos.
    """

    def __init__(
        self,
        directory,
        name=ORTOPHOTO_NAME,
        mask=MASK_NAME,
        structure_id=None,
        inspection_id=None,
        save_data=True,
    ):
        logger.info("                                ")
        logger.info("---> Análise de Ortomosaico <---")
        self.save_data = save_data
        self.directory = directory
        self.name = name
        self.ortophoto_path = os.path.join(directory, name)
        self.mask_path = os.path.join(directory, mask)

        self.ortophoto = Ortophoto(self.ortophoto_path)
        self.mask = self.load_mask(self.mask_path)
        self.slope_mask = self.extract_mask("slope")
        self.structure_id = structure_id
        self.inspection_id = inspection_id

        logger.info(
            f"Ortomosaico carregado: {self.ortophoto_path}. Shape: {self.ortophoto.shape}."
        )
        logger.info(f"Máscara carregada: {self.mask_path}. Shape: {self.mask.shape}.")

        self.analysis()

    def load_mask(self, mask_path):
        """
        Carrega a máscara de segmentação do ortomosaico e retorna a mesma em formato de labels.
        """
        rgb_mask = tifffile.imread(mask_path)
        mask = rgb_to_mask(rgb_mask)
        return mask

    def extract_mask(self, class_name="slope"):
        """
        Cria uma máscara de segmentação cujos valores positivos correspondem a classe
        definida por class_name.
        """
        mask = (self.mask == SEGMENTATION_CLASSES[class_name]).astype(int)
        logger.info(f"Criando máscara binária para a classe {class_name}.")
        return mask.astype(bool)

    def apply_mask(self, tensor, mask):
        """
        Aplica a máscara de segmentação mask ao tensor.
        """
        masked_tensor = np.zeros(tensor.shape)
        masked_tensor[mask] = tensor[mask]
        return masked_tensor

    def extract_masked_index(self, index_name):
        """
        Extrai o índice de vegetação index_name e aplica a máscara de segmentação.
        """
        return eval(
            f"self.apply_mask(self.ortophoto.get_{index_name}(), self.slope_mask)"
        )

    def get_boxplot_data(self, tensor):
        """
        Retorna métricas necessárias para construção de boxplot.
        """
        data = tensor[self.slope_mask].ravel()
        bp = plt.boxplot(data, showfliers=False, showmeans=True)

        statistics = {}
        statistics["lower_whisker"] = bp["whiskers"][0].get_ydata()[1]
        statistics["lower_quartile"] = bp["boxes"][0].get_ydata()[1]
        statistics["median"] = bp["medians"][0].get_ydata()[1]
        statistics["upper_quartile"] = bp["boxes"][0].get_ydata()[2]
        statistics["upper_whisker"] = bp["whiskers"][1].get_ydata()[1]
        statistics["means"] = bp["means"][0].get_ydata()[0]

        return statistics

    def get_category_data(self, tensor):
        """
        Retorna a contagem de pixels por categoria e metrica de saude vegetal.
        """
        bins = [-1, 0, 0.3, 0.6, 1.0]
        data = tensor[self.slope_mask].ravel()

        counts, _ = np.histogram(data, bins=bins)

        total = np.sum(counts)

        category_data = {}
        category_data["count1"] = np.round(counts[-1] / total, 3)
        category_data["count2"] = np.round(counts[-2] / total, 3)
        category_data["count3"] = np.round(counts[-3] / total, 3)
        category_data["count4"] = np.round(counts[-4] / total, 3)
        category_data["metric"] = category_data["count1"]

        return category_data

    def get_histogram_data(self, tensor):
        """
        Retorna a contagem de pixels para histograma.
        """
        bins = [
            -1.0,
            -0.9,
            -0.8,
            -0.7,
            -0.6,
            -0.5,
            -0.4,
            -0.3,
            -0.2,
            -0.1,
            0.0,
            0.1,
            0.2,
            0.3,
            0.4,
            0.5,
            0.6,
            0.7,
            0.8,
            0.9,
            1.0,
        ]
        data = tensor[self.slope_mask].ravel()
        counts, _ = np.histogram(data, bins=bins)

        histogram_bins = {}
        for i in range(len(counts)):
            bin_name = f"bin{i+1}"
            histogram_bins[bin_name] = counts[i]

        return histogram_bins

    def analysis(self, indexes=VEGETATION_INDEXES):
        """
        Executa as rotinas de análise.
        1- Estatísticas de boxplot dos índices.
        2- Contagem de pixels por categoria.
        3- Métrica de saúde vegetal (Cat1 + Cat2)
        """
        dataframe_rows = []

        for index_name in indexes:
            logger.info(f"Analisando o índice de vegetação {index_name}.")
            masked_index = self.extract_masked_index(index_name)

            boxplot_data = self.get_boxplot_data(masked_index)
            category_data = self.get_category_data(masked_index)
            histogram_data = self.get_histogram_data(masked_index)

            statistics_dict = {
                "label": index_name,
                **boxplot_data,
                **category_data,
                **histogram_data,
            }
            dataframe_rows.append(statistics_dict)

        self.statistics = pd.DataFrame(dataframe_rows)

        if self.save_data:
            path = os.path.join(self.directory, "statistics.csv")
            self.statistics.to_csv(path)
            self.statistics.to_json(path.replace(".csv", ".json"))
            logger.info(f"Estatísticas salvas em: {path}")

            if self.structure_id and self.inspection_id:
                self.save_data_to_db(
                    self.structure_id, self.inspection_id, self.statistics
                )

    def save_data_to_db(self, structure_id, inspection_id, data):
        """
        Salva os dados do boxplot no banco de dados.
        """
        for index, row in data.iterrows():
            boxplot = BoxPlot(
                # Nome do Índice
                label=row["label"],
                # Dados para Boxplot
                lower_whisker=row["lower_whisker"],
                lower_quartile=row["lower_quartile"],
                median=row["median"],
                upper_quartile=row["upper_quartile"],
                upper_whisker=row["upper_whisker"],
                means=row["means"],
                # Dados de Categorias
                count1=row["count1"],
                count2=row["count2"],
                count3=row["count3"],
                count4=row["count4"],
                metric=row["metric"],
                # Dados de Histograma
                bin1=row["bin1"],
                bin2=row["bin2"],
                bin3=row["bin3"],
                bin4=row["bin4"],
                bin5=row["bin5"],
                bin6=row["bin6"],
                bin7=row["bin7"],
                bin8=row["bin8"],
                bin9=row["bin9"],
                bin10=row["bin10"],
                bin11=row["bin11"],
                bin12=row["bin12"],
                bin13=row["bin13"],
                bin14=row["bin14"],
                bin15=row["bin15"],
                bin16=row["bin16"],
                bin17=row["bin17"],
                bin18=row["bin18"],
                bin19=row["bin19"],
                bin20=row["bin20"],
                # ID de Estrutura e Inspeção
                boxplot_structure_id=structure_id,
                boxplot_inspection_id=inspection_id,
            )
            boxplot.save()
            logger.info(f"Dados do boxplot salvos para {row['label']}.")
