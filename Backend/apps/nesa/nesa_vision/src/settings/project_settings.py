LOG_TO_FILE = False
RANDOM_SEED = 42

SCALER = "robust_scaler.pkl"
SCALER_PATH = "apps/nesa/nesa_vision/models/robust_scaler.pkl"
MODEL_PATH = "apps/nesa/nesa_vision/models/20240611-2135_150_32_42_0.99_0.99/20240611-2135_150_32_42_0.99_0.99.h5"

ORTOPHOTO_NAME = "ortophoto.tif"
MASK_NAME = "mask.tiff"

PATCH_SIZE = 256
INFERENCE_STEP_SIZE = 256

MASK_COLORS = {
    "uncategorized": [0, 0, 0],  # #000000
    "slope": [6, 214, 160],  # #06d6a0
    "stairs": [7, 59, 76],  # #073b4c
    "drain": [239, 71, 111],  # #ef476f
    "rocks": [181, 23, 158],  # #b5179e
    # "soil": [255, 209, 102],  # #ffd166
}

SEGMENTATION_CLASSES = {
    "uncategorized": 0,
    "slope": 1,
    "stairs": 2,
    "drain": 3,
    "rocks": 4,
    # "soil": 5,
}

NUM_CLASSES = len(SEGMENTATION_CLASSES.keys())
NAMES = list(SEGMENTATION_CLASSES.keys())
VEGETATION_INDEXES = ["ndvi", "gndvi", "ndre", "ndwi"]
