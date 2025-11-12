import tifffile
import logging
import cv2
import numpy as np
import os
import sys

from tensorflow.config import list_physical_devices

sys.path.append("..")

from ..settings.project_settings import *


def logger_setup(to_file=True, log_file="../../logs.log"):
    log_fmt = "%(asctime)s - %(levelname)s - %(message)s"
    if to_file == False:
        log_file = None
    elif to_file == True:
        log_file = "../../logs.log"
    logging.basicConfig(level=logging.INFO, format=log_fmt, filename=log_file)
    logger = logging.getLogger(__name__)
    return logger


def check_gpu_support(logger):
    # Testando suporte para GPU
    if len(list_physical_devices("GPU")) > 0:
        logger.info("GPU disponível para treinamento e inferências.")
    else:
        logger.info("GPU não disponível. Utilizando a CPU.")


def rgb_to_mask(rgb_mask, bgr=False):
    """
    Convert image mask from rgb values to int values.
    """
    # If the original mask is in BGR, converts to RGB first
    if bgr:
        rgb_mask = cv2.cvtColor(rgb_mask, cv2.COLOR_BGR2RGB)

    mask = cv2.cvtColor(rgb_mask, cv2.COLOR_RGB2GRAY)

    # Change pixels for class values
    for segmentation_class in SEGMENTATION_CLASSES.keys():
        mask[rgb_mask[:, :, 0] == MASK_COLORS[segmentation_class][0]] = (
            SEGMENTATION_CLASSES[segmentation_class]
        )

    # Raises an error if the class assigned does not work
    if not set(np.unique(mask)).issubset(SEGMENTATION_CLASSES.values()):
        raise ValueError("Error in mask conversion from RGB to Labels.")

    return mask


def mask_to_rgb(mask):
    """
    Convert image mask from int values to rgb values.
    """
    height, width = mask.shape[:2]
    rgb_mask = np.zeros((height, width, 3), dtype=np.uint8)

    for segmentation_class in SEGMENTATION_CLASSES.keys():
        temp_mask = np.all(mask == SEGMENTATION_CLASSES[segmentation_class], axis=2)
        rgb_mask[temp_mask] = np.array(MASK_COLORS[segmentation_class])

    return rgb_mask


# Load dataset from path. The dataset contains images stored in /data/processed/dataset_name/images/, and labels stored in /data/processed/dataset_name/labels/.
def load_dataset(path="../../data/processed/", ignore_dataset=None):
    """
    Load all datasets from path. The dataset contains images and labels
    Images are stored in /data/processed/dataset_name/images/
    Labels are stored in /data/processed/dataset_name/labels/
    """
    datasets = [f for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]
    images = []
    labels = []

    for dataset_name in datasets:
        if dataset_name == ignore_dataset:
            break
        images_path = os.path.join(path, dataset_name, "images/")
        labels_path = os.path.join(path, dataset_name, "labels/")

        for image_name in os.listdir(images_path):
            image = tifffile.imread(os.path.join(images_path, image_name))
            label = tifffile.imread(os.path.join(labels_path, image_name))
            label = rgb_to_mask(label)

            images.append(image)
            labels.append(label)

    images = np.asarray(images)
    labels = np.asarray(labels)
    labels = np.expand_dims(labels, axis=-1)

    return images, labels


def create_directory(directory):
    """
    Create a new directory if it does not exist.

    Args:
        directory (str): Path to directory
    """
    if not os.path.exists(directory):
        os.makedirs(directory)
