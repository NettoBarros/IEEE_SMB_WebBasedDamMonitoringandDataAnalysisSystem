from patchify import patchify, unpatchify
from random import shuffle
import matplotlib.pyplot as plt
import numpy as np
import os
import sys
import tifffile


def find_next_divisible(x, patch_size):
    """
    Returns the next number after x that is divisible by patch_size.
    """
    return (x - (x % patch_size)) + patch_size


def reshape_single_channel_matrix(mat):
    """
    Add a third dimension to the input matrix. Example: (x, y) -> (x, y, 1).
    """
    if len(mat.shape) == 2:
        return mat.reshape(mat.shape[0], mat.shape[1], 1)
    else:
        return mat


def get_padded_shape(original_shape, patch_size):
    """
    Calculate and returns the shape of the padded version according to pad size.
    """
    padded_shape = (
        find_next_divisible(original_shape[0], patch_size),
        find_next_divisible(original_shape[1], patch_size),
        original_shape[2],
    )
    return padded_shape


def pad_image(mat, padded_shape):
    """
    Pads the image on the padded_shape tuple (x,y).
    """
    canvas = np.zeros((padded_shape[0], padded_shape[1], padded_shape[2]))
    canvas[: mat.shape[0], : mat.shape[1]] = mat
    return canvas


def undo_padding(mat, original_shape):
    """
    Undo the padding operation based on the original image shape.
    """
    unpadded = mat[: original_shape[0], : original_shape[1]]
    return unpadded


def create_patches(mat, patch_shape, step):
    """
    Apply the Patchify function to the image, dividing it into
    (patch_size, patch_size) patches with a step size.
    """
    patches = patchify(mat, patch_size=patch_shape, step=step)
    return patches


def stitch_image(patches, padded_shape):
    """
    Undo the Patchify operation and rebuilds image to its original shape.
    """
    rebuilt = unpatchify(patches, padded_shape)

    return rebuilt


def plot_patches(patches):
    """
    Rebuild the original patchified figure using subplots. For sanity checking.
    """
    fig1, ax1 = plt.subplots(
        nrows=patches.shape[0], ncols=patches.shape[1], figsize=(7, 15)
    )

    for R1 in range(patches.shape[0]):
        for C1 in range(patches.shape[1]):
            ax1[R1, C1].imshow(patches[R1, C1, 0, :, :, :])
            ax1[R1, C1].axis("off")

    return fig1


def get_patches_as_list(patches, shuffled=False):
    """
    Returns all image patches in list format.
    """
    patch_list = []

    for x in range(patches.shape[0]):
        for y in range(patches.shape[1]):
            for z in range(patches.shape[2]):
                patch_list.append(patches[x, y, z, :, :, :])

    if shuffled:
        patch_list = shuffle(patch_list)

    return patch_list


def remove_blank_patches(patch_list, blank_value=0):
    """
    Remove patch if all of its values are equal to blank_value.
    """
    new_list = []
    for patch in patch_list:
        if not np.all(patch == 0):
            new_list.append(patch)

    return new_list


def save_patch_list_as_numpy(patch_list, path, file_format=".npy", name="patch"):
    """
    Save all the patches in patch_list to the specified path.
    """

    if not os.path.exists(path):
        os.makedirs(path)

    for i, patch in enumerate(patch_list):
        filename = f"{name}_%05d{file_format}" % i
        filepath = path + filename
        np.save(filepath, patch)


def save_patch_list_as_tiff(patch_list, path, file_format=".tiff", name="patch"):
    """
    Save all the patches in patch_list to the specified path as .TIFF.
    """

    if not os.path.exists(path):
        os.makedirs(path)

    for i, patch in enumerate(patch_list):
        filename = f"{name}_%05d{file_format}" % i
        filepath = path + filename
        tifffile.imwrite(filepath, patch)
