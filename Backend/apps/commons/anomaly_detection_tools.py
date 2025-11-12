import pandas as pd
from sklearn.neighbors import LocalOutlierFactor
from datetime import datetime
import pickle
import os
import numpy as np
from apps.nesa.models import Project_Threshold

def train(measurements, dt_ini, dt_fim, outlier_fraction=0.01):
    '''
    sens_df:pd.DataFrame
    '''
    messages = []
    measurements_with_sensor_names = measurements.distinct("sensor")
    for measurement_with_sensor_name in measurements_with_sensor_names:
        sensor_name = measurement_with_sensor_name.sensor.sensor_name
        outputs = measurements.filter(sensor=measurement_with_sensor_name.sensor).distinct("exit_direction").values("exit_direction")
        for output in outputs:
            filtered_measurements = measurements.filter(sensor=measurement_with_sensor_name.sensor, exit_direction=output["exit_direction"],
                                                        measurement_date__range=[dt_ini, dt_fim])
            
            project_threshold = Project_Threshold.objects.filter(sensor=measurement_with_sensor_name.sensor.id, exit_direction=output["exit_direction"]).first()
            if project_threshold is not None:
                
                project_attention_threshold = project_threshold.attention_threshold
                project_alert_threshold = project_threshold.alert_threshold

                constante_to_define_alerta = get_constant_alert(project_attention_threshold, project_alert_threshold)

                train_series_queryset = remove_anomaly_states(filtered_measurements)
                valid, qtd = validate(train_series_queryset,sensor_name)
                
                if valid:
                    column_x_train = transform_input_data_column(train_series_queryset)
                    row_x_train = transform_input_data_row(train_series_queryset)
                    model = LocalOutlierFactor(contamination=outlier_fraction, novelty=True).fit(column_x_train)
                    attention_threshold = get_limiar_train_attention(model,column_x_train, row_x_train)
                    alert_threshold = get_limiar_train_alert(attention_threshold, constante_to_define_alerta)
                    output_model = {'Sensor': sensor_name,
                                    'Output': output["exit_direction"],
                                    'Model': model,
                                    'DtTrain': datetime.now(),
                                    'DtIni': dt_ini,
                                    'Dt_fim':dt_fim,
                                    'attention_threshold': attention_threshold,
                                    'alert_threshold': alert_threshold,
                                    'train_series': row_x_train,
                                    'data_series': get_row_measurement_dates(filtered_measurements)}
                    messages.append({'message': f"Modelo do sensor {sensor_name} gerado com sucesso!", 'type': 'sucess'})
                    save_model(f"{sensor_name}_{removeSpecialCharacters(output['exit_direction'])}_{generateIdWithDate()}", output_model)
                else:
                    messages.append({'message': f"O sensor {sensor_name} na direção {output['exit_direction']} não possui os dados necessários para a geração do modelo.", 'type': 'error'})
                #persist models, .h5, nome_sensor_timestamp
            else:
                messages.append(f'Não existem limiares de projeto para o sensor {sensor_name} na direção/saída {output["exit_direction"]}.')
    return messages #lista de mensagens para sucesso ou nao



def test(measurements, dt_ini, dt_fim, limiar=80):
    '''
    sens_df:pd.DataFrame
    '''
    
    preds = []
    messages = []
    
    measurements_with_sensor_names = measurements.distinct("sensor")
    for measurement_with_sensor_name in measurements_with_sensor_names:
        sensor_name = measurement_with_sensor_name.sensor.sensor_name
        outputs = measurements.filter(sensor=measurement_with_sensor_name.sensor).distinct("exit_direction").values("exit_direction")
        for output in outputs:
            model = load_model(sensor_name, output['exit_direction'])
            if(model):
                #recuperar os modelos para cada sensor
                #filtrar dados do sensor por dt_ini e dt_fim
                with_sample = False
                sens_names_output = [output["exit_direction"] for output in outputs]
                #for model in models:
                model_output = model['Output']
                colunas = ['value_predict','state_predict','limiar','value_original','state_original']
                results = pd.DataFrame(columns=colunas)
                if model['Sensor'] == sensor_name and model_output in sens_names_output:
                    filtered_measurements = measurements.filter(sensor=measurement_with_sensor_name.sensor, exit_direction=model_output,
                                                        measurement_date__range=[dt_ini, dt_fim])
                    dt_ini_train = model['DtIni']
                    dt_fim_train = model['Dt_fim']

                    train_date_filtered_measurements = measurements.filter(sensor=measurement_with_sensor_name.sensor, exit_direction=model_output,
                                    measurement_date__range=[dt_ini_train, dt_fim_train])
                    project_threshold = Project_Threshold.objects.filter(sensor=measurement_with_sensor_name.sensor.id, exit_direction=output["exit_direction"]).first()
                    if project_threshold is not None:
                        project_attention_threshold = project_threshold.attention_threshold
                        project_alert_threshold = project_threshold.alert_threshold

                        constante_to_define_alerta = get_constant_alert(project_attention_threshold, project_alert_threshold)

                        test_series = filtered_measurements.values("sensor_data")
                        test_data = filtered_measurements.values("measurement_date")
                        states_query = filtered_measurements.values("state")
                        test_label = [state["state"] for state in states_query]
                        X_test = transform_input_data_column(test_series)

                        row_x_test = transform_input_data_row(train_date_filtered_measurements.values("sensor_data"))
                        column_x_test = transform_input_data_column(filtered_measurements.values("sensor_data"))
                        model_test = LocalOutlierFactor(contamination=0.001, novelty=True).fit(X_test)
                        attention_threshold = get_limiar_test_attention(model['Model'], column_x_test, row_x_test)
                        alert_threshold = get_limiar_train_alert(attention_threshold, constante_to_define_alerta)

                        pred = model['Model'].predict(X_test) #decision function
                        d_f = model['Model'].decision_function(X_test)

                        for i in range(0, len(column_x_test)):
                            if column_x_test[i] > alert_threshold[i]:
                                results.loc[len(results)] = [d_f[i],'alerta',alert_threshold[i],column_x_test[i][0],test_label[i]]
                                train_date_filtered_measurements.filter(sensor_data=column_x_test[i][0]).update(state="alerta", attention_threshold=attention_threshold[i], alert_threshold=alert_threshold[i])
                            elif column_x_test[i] > attention_threshold[i]:
                                results.loc[len(results)] = [d_f[i],'atencao',attention_threshold[i],column_x_test[i][0],test_label[i]]
                                train_date_filtered_measurements.filter(sensor_data=column_x_test[i][0]).update(state="atencao", attention_threshold=attention_threshold[i], alert_threshold=alert_threshold[i])
                            else:
                                results.loc[len(results)] = [d_f[i],'normal',0,column_x_test[i][0],test_label[i]]
                                train_date_filtered_measurements.filter(sensor_data=column_x_test[i][0]).update(attention_threshold=attention_threshold[i], alert_threshold=alert_threshold[i])
                        
                        samples = [sample["sensor_data"] for sample in test_series]
                        data = [data["measurement_date"] for data in test_data]
                        preds.append({'Sensor': sensor_name, 'Output': output, 'Data': data,'Samples': samples, 'Predictions': results.to_dict(), 'attention_threshold': attention_threshold.tolist(),'alert_threshold': alert_threshold.tolist()}) #pred -> normal, atencao, alerta
                        #precisa associar predicao com amostra de teste
                        with_sample = True
                        if not with_sample:
                            messages.append(f'Não existe exemplos para teste com o sensor {sensor_name}.')
                else:
                    messages.append(f'Não existem limiares de projeto para o sensor {sensor_name}.')
            else:
                messages.append(f'Não existe modelos para esse sensor {sensor_name}.')
    #-1 anomaly, 1 normal
    #discriminate attention and alert        
    return (preds,messages) #JSON

def get_row_measurement_dates(filtered_measurements):
    filtered_measurements = filtered_measurements.filter(state="normal").values("measurement_date")
    date_series = np.ones(len(filtered_measurements), dtype='<U10')
    index = 0
    for measurement in filtered_measurements:
        date_series[index] = measurement["measurement_date"]
        index+=1
    print(date_series)
    return date_series


def get_limiar_test_attention(model, x_test, row_train_series):
    _, knn = model.kneighbors(x_test)
    thrs = np.mean(row_train_series[knn], axis=1)

    return thrs


def get_limiar_train_attention(model, train, row_train_series):
    _, knn = model.kneighbors(train)
    thrs = np.mean(row_train_series[knn], axis=1)
    return thrs


def get_constant_alert(attention_base,alert_base):
  return attention_base / alert_base


def get_limiar_train_alert(attention_threshold, constante_attention_alert):
    return attention_threshold / constante_attention_alert


def remove_anomaly_states(measurements):
    '''
    sens_df:pd.DataFrame
    '''
    measurements = measurements.filter(state="normal")
    return measurements.values("sensor_data")

def transform_input_data_column(sens_meas):
    '''
    sens_meas: pd.Series
    '''
    train_series = np.zeros(len(sens_meas))
    index = 0
    for measurement in sens_meas:
        train_series[index] = measurement["sensor_data"]
        index+=1
    return train_series.reshape(-1, 1)

def transform_input_data_row(sens_meas):
    '''
    sens_meas: pd.Series
    '''
    train_series = np.zeros(len(sens_meas))
    index = 0
    for measurement in sens_meas:
        train_series[index] = measurement["sensor_data"]
        index+=1
    return train_series


def validate(values, sensor):
    '''
    Checks if the given sensor values pass the validation criteria.

    Parameters:
        - values (pd.Series): A pandas Series containing the sensor values.
        - sensor (str): The name of the sensor that produced the values.

    Returns:
        A boolean value indicating if the values pass the validation criteria.

    Raises:
        None.

    Validation criteria:
        - The Series must have at least 10 values.
        - Additional criteria may be added in the future.
    '''

    qtd = len(values)
    if qtd >= 20:
        return (True, qtd)

    return (False, qtd)





def save_model(filename, values,path ='models'):
    if not os.path.exists(path):
        os.makedirs(path)

    with open(f'{path}/{filename}.pickle', 'wb') as handle:
        pickle.dump(values, handle, protocol=pickle.HIGHEST_PROTOCOL)

def load_model(sensor, sufixo, path='models' ):
    file = f'{sensor}_{sufixo}.pickle'

    files = os.listdir(path)
    filtered_files = list(filter(lambda x: sensor in x, files))

    if(len(filtered_files) > 0):
        file = sorted(filtered_files)[-1]

    if(file):
        if(not os.path.isfile(f'{path}/{file}')):
            return False;
        with open(f'{path}/{file}', 'rb') as handle:
            model = pickle.load(handle)
            return model;



def generateIdWithDate():
    return f'{datetime.now()}'.replace('-', '').replace('.', '').replace(':', '').replace(' ','');

def removeSpecialCharacters(value):
    return value.replace('/','').replace('//','');
#maybe a function for loading sensor measures betweeen given dates
#maybe a function to save the model -> save one model for each