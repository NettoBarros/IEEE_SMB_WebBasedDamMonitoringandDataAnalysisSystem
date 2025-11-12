from apps.nesa import models
from typing import List, Dict
import random

STEP = 5

def generate_boxplot_data(inspection_id: int) -> List[Dict]:
    labels = ['ndvi', 'gndvi', 'ndre', 'ndwi']
    boxplot_data = []

    for i, label in enumerate(labels, start=8):
        base_data = {
            'label': label,
            'lower_whisker': random.uniform(0.65, 0.75),
            'lower_quartile': random.uniform(0.75, 0.85),
            'median': random.uniform(0.75, 0.85),
            'upper_quartile': random.uniform(0.8, 0.9),
            'upper_whisker': random.uniform(0.85, 0.95),
            'means': random.uniform(0.75, 0.85),
            'boxplot_inspection_id': inspection_id,
            'boxplot_structure_id': models.Visual_Inspection.objects.get(id=inspection_id).structure_id,
        }

        for key in ['lower_whisker', 'lower_quartile', 'median', 'upper_quartile', 'upper_whisker', 'means']:
            base_data[key] += random.uniform(-0.05, 0.05) * base_data[key]

        boxplot_data.append(base_data)

    return boxplot_data


def insert_dummies_in_db():
    most_recent_inspection = models.Visual_Inspection.objects.latest('inspection_date')
    last_inspection = models.Visual_Inspection.objects.latest('id')
    last_structure = models.Structure.objects.latest('id')

    data = [generate_boxplot_data(most_recent_inspection.id) for _ in range(STEP)]
    for i in range(STEP):
        models.BoxPlot.objects.bulk_create([models.BoxPlot(**x) for x in data[i]])


