from email import message
from apps.nesa.models import Structure, Sensor, Measurement, User, Project_Threshold
from apps.nesa.serializers import SensorSerializer, MeasurementSerializer
from collections import defaultdict
from django.apps import apps
from .pdf_tools import csv_to_df,read_locations, read_locations_from_xlsx
import jwt
import pandas as pd


class BulkCreateManager(object):
    """
    This helper class keeps track of ORM objects to be created for multiple
    model classes, and automatically creates those objects with `bulk_create`
    when the number of objects accumulated for a given model class exceeds
    `chunk_size`.
    Upon completion of the loop that's `add()`ing objects, the developer must
    call `done()` to ensure the final set of objects is created for all models.
    """

    def __init__(self, chunk_size=100):
        self._create_queues = defaultdict(list)
        self.chunk_size = chunk_size

    def _commit(self, model_class):
        model_key = model_class._meta.label
        model_class.objects.bulk_create(self._create_queues[model_key])
        self._create_queues[model_key] = []

    def add(self, obj):
        """
        Add an object to the queue to be created, and call bulk_create if we
        have enough objs.
        """
        model_class = type(obj)
        model_key = model_class._meta.label
        self._create_queues[model_key].append(obj)
        if len(self._create_queues[model_key]) >= self.chunk_size:
            self._commit(model_class)

    def done(self):
        """
        Always call this upon completion to make sure the final partial chunk
        is saved.
        """
        for model_name, objs in self._create_queues.items():
            if len(objs) > 0:
                self._commit(apps.get_model(model_name))


def get_sensor_data(sensor_name, structure):
    sensor_data = {}
    information = sensor_name.split('-')
    sensor_data['sensor_name'] = sensor_name
    sensor_data['sensor_model'] = information[0]
    sensor_data['latitude'] = 0
    sensor_data['longitude'] = 0
    sensor_data['cluster'] = 0
    sensor_data['altura'] = 0
    sensor_data['structure'] = structure.id
    return sensor_data

def get_sensors_locations(structure):
    locations = pd.DataFrame()
    if structure.structure_name == "BVSA":
        locations = read_locations_from_xlsx("./apps/nesa/files/bvsa_information.xlsx")
    elif structure.structure_name == "6C":
        locations = read_locations_from_xlsx("./apps/nesa/files/dique6c_information.xlsx")
    return locations

def set_sensor_location(sensor_data, locations):
    if not locations.empty:
        sensor_name = sensor_data['sensor_name']
        if sensor_name in locations.index:
            sensor_data['latitude'] = locations.loc[sensor_name, 'Latitude']
            sensor_data['longitude'] = locations.loc[sensor_name, 'Longitude']
            sensor_data['cluster'] = locations.loc[sensor_name, 'Cluster']
            sensor_data['altura'] = locations.loc[sensor_name, 'Altura']
    return  sensor_data

def get_measurement_data(row):
    measurement_data = {}
    measurement_data['measurement_date'] = row['Data']
    measurement_data['manual_report'] = 'Example'
    measurement_data['sensor_data'] = row['Valor']
    measurement_data['state'] = row['Estado']
    measurement_data['measurement_unit'] = row['Unidade']
    measurement_data['exit_direction'] = row['Direcao_Saida']
    return measurement_data

def save_sensors_from_dataframe(pdf_dataframe, structure_id):
    structure = Structure.objects.get(id=structure_id)
    locations = get_sensors_locations(structure)
    for sensor in pdf_dataframe.index.unique():
        sensor_data = get_sensor_data(sensor, structure)

        sensor_data = set_sensor_location(sensor_data, locations)
        serializer = SensorSerializer(data=sensor_data)
        serializer.is_valid(raise_exception=False)
        if not serializer.errors:
            sensor_instance = Sensor.objects.create(sensor_name=sensor_data['sensor_name'], sensor_model=sensor_data['sensor_model'], 
            latitude=sensor_data['latitude'], longitude=sensor_data['longitude'], structure=structure, cluster=sensor_data['cluster'],
            altura=sensor_data['altura'])
            sensor_instance.save()
        else:
            print(serializer.errors)

def save_measurement_from_dataframe(pdf_dataframe, request):
    manager = BulkCreateManager(chunk_size=len(pdf_dataframe.index))
    token = request.headers.get('Authorization').split(' ')[1]
    payload = jwt.decode(token, 'secret',  algorithms=['HS256'])
    user = User.objects.get(id=payload['id'])
    sensors = Sensor.objects
    
    for index, row in pdf_dataframe.iterrows():
        sensor = sensors.get(sensor_name=index)
        measurement_data = get_measurement_data(row)
        measurement = Measurement(manual_report=measurement_data['manual_report'], sensor_data=measurement_data['sensor_data'], 
            measurement_date=measurement_data['measurement_date'], measurement_unit=measurement_data['measurement_unit'], state="normal",
            exit_direction=measurement_data['exit_direction'], sensor=sensor, user=user)
        manager.add(measurement)
    manager.done()