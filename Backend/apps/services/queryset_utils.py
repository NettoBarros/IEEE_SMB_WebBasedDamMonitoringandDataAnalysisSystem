from django.db.models import QuerySet
from apps.nesa.models import Sensor
from apps.commons.cluster_corr_util import perform_coef_reservoir, perform_coef2
import pandas as pd
import numpy as np
# from apps.nesa.cluster_corr_util import queryset_to_dataframe

class DataService:
    @staticmethod
    def queryset_to_dataframe(queryset: QuerySet) -> pd.DataFrame:
        data = list(queryset.values())
        return pd.DataFrame(data)

    @staticmethod
    def process_data(queryset: QuerySet, sensor_name: str = None) -> pd.DataFrame:
        data = DataService.queryset_to_dataframe(queryset)
        data = data[["measurement_date", "sensor_data", "sensor_id", "measurement_unit", "exit_direction", "state"]]
        data = data.rename(columns = {
            "sensor_id": "Sensor_Id",
            "measurement_date": "Data",
            "exit_direction": "Direcao_Saida",
            "measurement_unit": "Unidade",
            "state": "Estado",
            "sensor_data": "Valor"
        })
        #if sensor_name:
        #    data.sensor_id = Sensor.objects.get(sensor_name=sensor_name).id
        sensor = Sensor.objects.filter(sensor_name=sensor_name).first()
        if sensor:
            data["Sensor_Id"] = sensor.id
    
        sensor_mapping = dict(Sensor.objects.values_list('id', 'sensor_name'))
        data['Sensor'] = data['Sensor_Id'].map(sensor_mapping)
        data = data[['Sensor', 'Data', 'Valor', 'Unidade', 'Direcao_Saida', 'Estado']]
        
        return data

    
    @staticmethod
    def get_neighbours(sensor_name: str, database: pd.DataFrame) -> dict:
        cluster_id = int(database[database['Sensor'] == sensor_name]['Cluster'])
        sensors = list(database[database['Cluster'] == cluster_id]['Sensor'])
        out = {}
        for s in sensors:
            out[s] = DataService.get_distance(sensor_name, s, database)
        return dict(sorted(out.items(), key = lambda item: item[1]))

    
    @staticmethod
    def get_distance(sensor_1, sensor_2) -> float:
        data_s1 = np.array([sensor_1.longitude, sensor_1.latitude, sensor_1.altura])
        data_s2 = np.array([sensor_2.longitude, sensor_2.latitude, sensor_2.altura])
        return np.linalg.norm(data_s1 - data_s2)

    @staticmethod
    def calculate_n_closest_sensors(sensor, n: int, queryset) -> list:
        neighbours = []
        for neighbour in queryset:
            distance = DataService.get_distance(sensor, neighbour)
            neighbours.append({
                'neighbour_name': neighbour.sensor_name,
                'neighbour_id': neighbour.id,
                'neighbour_distance': distance
            })
        # Sort sensors by distance
        neighbours.sort(key=lambda x: x['neighbour_distance'])
        return neighbours[:n]


    @staticmethod
    def generate_correlation_response(structure_data, water_data, sensor_name, neighbours):
        target_water_corr, target_water_p_value, target_water_exit_direction = perform_coef_reservoir(structure_data, water_data, sensor_name, 'RE-BM')[0]
        response = {
            'target_sensor': {
                'name': sensor_name,
                'id': Sensor.objects.get(sensor_name=sensor_name).id,
                'cluster': Sensor.objects.get(sensor_name=sensor_name).cluster,
                'water_correlation': target_water_corr,
                'water_p_value': target_water_p_value,
                'water_exit_direction': target_water_exit_direction
            },
            'correlations': []
        }

        for neighbour in neighbours:
            correlations = perform_coef2(structure_data, sensor_name, neighbour['neighbour_name'])
            water_correlations = perform_coef_reservoir(structure_data, water_data, neighbour['neighbour_name'], 'RE-BM')
            
            neighbour['correlation_w_target'] = []
            for correlation, p_value, exit_direction in correlations:
                neighbour['correlation_w_target'].append({
                    'exit_direction': exit_direction,
                    'correlation': correlation,
                    'p_value': p_value,
                })
            
            neighbour['water_correlation'] = []
            for water_correlation, water_p_value, water_exit_direction in water_correlations:
                neighbour['water_correlation'].append({
                    'water_exit_direction': water_exit_direction,
                    'water_correlation': water_correlation,
                    'water_p_value': water_p_value,
                })

            response['correlations'].append(neighbour)

        return response