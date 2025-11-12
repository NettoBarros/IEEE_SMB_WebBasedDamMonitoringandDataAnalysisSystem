
import json
import numpy as np
from pandas import DataFrame, Series
from sklearn.neighbors import LocalOutlierFactor
from .cluster_corr_util import perform_coef2

COLUMN_RESULT = 'Estado'
ESTADO_ALERTA = 'alerta'
ESTADO_NORMAL = 'normal'
ESTADO_VALUE = 'Valor'
COLUMN_SENSOR = 'Sensor'
COLUMN_DIRECAO_SAIDA = 'Direcao_Saida'
COLUMN_LONGITUDE = 'Longitude' 
COLUMN_LATITUDE = 'Latitude'
COLUMN_ALTURA = 'Altura'
COLUMN_DATE = 'Data'

def get_limits(serie: Series):
    Q1 = serie.quantile(0.25)
    Q3 = serie.quantile(0.75)
    IIQ = Q3 - Q1
    limite_inferior = Q1 - .50 * IIQ
    limite_superior = Q3 + .50 * IIQ
    return limite_inferior, limite_superior

def remove_outliers(serie: Series, limite_inferior: float, limite_superior: float):
    """
    Returns:
    - Series: A new Pandas Series containing the non-outlier values from the original series.
    """
    sel = (serie >= limite_inferior) & (serie <= limite_superior)
    return sel

def novelty_detection(serie: Series, selection: Series, outliers_fraction:float = 0.01):
    X_train = serie[selection].to_numpy().reshape(-1, 1)
    X_test = serie[~selection].to_numpy().reshape(-1, 1)
    clf = LocalOutlierFactor(contamination=outliers_fraction, novelty=True).fit(X_train)

    return clf.predict(X_test)

def get_results(df_lof: DataFrame, predictions: np.ndarray, selection: Series):
    df_lof.loc[~selection,COLUMN_RESULT] = DataFrame.Series(predictions,index=df_lof[~selection].index).apply(lambda x: ESTADO_NORMAL if x==1 else ESTADO_ALERTA)
    return df_lof

def anomaly_detection(dados: DataFrame):
    serie = dados[ESTADO_VALUE]
    df_lof = dados.copy()
    limite_inferior, limite_superior = get_limits(serie)
    selection = remove_outliers(serie,limite_inferior, limite_superior)

    predictions = novelty_detection(serie,selection)
    return get_results(df_lof, predictions, selection)


def has_anomaly(results: DataFrame):
    return ESTADO_ALERTA in results[COLUMN_RESULT].values


def novelty_detection(serie: Series, selection: Series, outliers_fraction:float = 0.01):
    X_train = serie[selection].to_numpy().reshape(-1, 1)
    X_test= serie[~selection].to_numpy().reshape(-1, 1)
    clf = LocalOutlierFactor(contamination=outliers_fraction, novelty=True).fit(X_train)

    if(len(X_test) == 0):
        return np.array([])

    return clf.predict(X_test)

def get_covariancia(sensor_base, sensor):
    data_sensor_base = get_data_by_sensor(sensor_base) #to-do: traz todas as leituras do sensor
    data_sensor = get_data_by_sensor(sensor) #to-do: traz todas as leituras do sensor
    
    data = DataFrame.concat([data_sensor_base, data_sensor], ignore_index=True)
    pearson_coef = perform_coef2(data,sensor_base,sensor)
    return pearson_coef

def get_data(sensor_name: str):
    data_all = get_data_by_sensor(sensor_name) #to-do: traz todas as leituras do sensor
   
    sensor_direct = data_all[data_all[COLUMN_SENSOR] == sensor_name][COLUMN_DIRECAO_SAIDA].unique()
    if(len(sensor_direct) > 0):
        sel = (data_all[COLUMN_SENSOR] == sensor_name) & (data_all[COLUMN_DIRECAO_SAIDA] == sensor_direct[0]) & (data_all[COLUMN_DATE] >= '2016-01-01')
        data = data_all[sel]
        return data, sensor_direct, sensor_name
    else:
        return None

def select_sensors(quantidade_sensores_cluster, sensores_cluster):
    if(quantidade_sensores_cluster >= len(sensores_cluster) ):
        raise ValueError("A quantidade de sensores desejada é maior que a quantidade de sensores deste cluster.")

    dicionario_ordenado = dict(sorted(sensores_cluster.items(), key=lambda item: item[1]))

    quantidade_selecionada = quantidade_sensores_cluster + 1
    sensores_selecionados = list(dicionario_ordenado.keys())[:quantidade_selecionada]
    return sensores_selecionados

def get_distance_between_sensors(sensor_name_1, sensor_name_2, database):
    data_s1 = database[database[COLUMN_SENSOR] == sensor_name_1][[COLUMN_LONGITUDE, COLUMN_LATITUDE, COLUMN_ALTURA]].values[0] # must be this way
    data_s2 = database[database[COLUMN_SENSOR] == sensor_name_2][[COLUMN_LONGITUDE, COLUMN_LATITUDE, COLUMN_ALTURA]].values[0] # must be this way
    return np.linalg.norm(data_s1 - data_s2)


def get_sensors_of_the_same_cluster_by_name(sensor_name):
    """
    Retorna um dicionário contendo os sensores que pertencem ao mesmo cluster que `sensor_name`.

    Args:
        sensor_name (str): O nome do sensor de referência.

    Returns:
        dict: Um dicionário contendo os sensores que pertencem ao mesmo cluster que `sensor_name``.
        Exemplo:  {'PZ-BM-BV-52': 0.0, 'PZ-BM-BV-53': 2.0600000740734647, 'PE-BM-BV-51': 3.200000093051738, 'PE-BM-BV-52': 3.2600000257918023 }
    """
    
    cluster_id = get_cluster_id(sensor_name)
    sensors = get_sensors_by_cluster_id(cluster_id)
    out = {}
    database_locations = get_database_location_by_sensor(sensors)
    
    for s in sensors:
        out[s] = get_distance_between_sensors(sensor_name, s, database_locations)    
    
    return dict(sorted(out.items(), key = lambda item: item[1])) # sort by distance


def get_cluster_id(sensor_name: str):
    return 1

def get_sensors_by_cluster_id(cluster_id: int):
    return [] # Lista com o nome do sensores

def get_database_location_by_sensor(sensores: []):
    return None # Dataframe com as colunas: Sensor, Latitude, Longitude, Altura

def get_data_by_sensor(sensor_name: str):
    return None # Dataframe com as colunas: Sensor, Estado, Valor, Direcao_Saida (obs.: todas as direções)



def execute_automatic(sensor_name, quantidade_sensores_cluster):
    sensores_cluster = get_sensors_of_the_same_cluster_by_name(sensor_name)
    sensores_selecionados = select_sensors(quantidade_sensores_cluster, sensores_cluster)
    results = []
    covariancia = {}

    for sensor in sensores_selecionados:
        data, _, _ = get_data(sensor)

        if(data is not None):
            results.append(anomaly_detection(data).to_json())

        is_sensor_selecionado = (sensor == sensor_name)
        if(not is_sensor_selecionado):
            pearson_coef = get_covariancia(sensor_name, sensor)
            covariancia[sensor] = pearson_coef

    return json.dumps({'Results': results, 'Covariancia': covariancia}) 
