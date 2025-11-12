from apps.nesa.models import Sensor

def return_sensors_from_cluster(cluster_id):
    """
    Recebe um cluster_id e retorna todos os sensores que pertencem a este cluster.
    """
    sensors = Sensor.objects.filter(cluster=cluster_id)
    # for i in sensors:
    #     print(i.sensor_name, i.sensor_model)  # Debugging

    # Retorna um objeto do django. Serializar caso necessário.
    return sensors.all()


def return_all_directions_for_sensor(sensor_id):
    """
    Recebe um sensor_id e retorna dados de todas as direções para as quais este
    sensor tem registro.
    """
    sensors = Sensor.objects.get(id=sensor_id)
    # print(sensors.direction_set.all())  # Debugging
    return sensors.direction_set.all()