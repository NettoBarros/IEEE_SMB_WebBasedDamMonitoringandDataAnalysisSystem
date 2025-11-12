from apps.nesa.models import WaterLevels, Measurement, Sensor, Structure, User
import pandas as pd

def import_csv(file_path):
    df = pd.read_csv(file_path)
    df.dropna(subset=['Valor'], inplace=True)
    df['Sensor'] = 'RE-BM'
    df['Unidade'] = 'm3'
    df['Direcao_Saida'] = 'Volume'
    df['Estado'] = 'Normal'
    df = df[['Sensor', 'Data', 'Valor', 'Unidade', 'Direcao_Saida', 'Estado']]
    print(df.head())
    # for index, row in df.iterrows():
    #     WaterLevels.objects.create(
    #             date = row['Data'],
    #             measurement = row['Valor'],
    #             sensor = row['Sensor'],
    #             unit = row['Unidade'],
    #             exit_direction = row['Direcao_Saida'],
    #             state = row['Estado']
    #             )
    if not Structure.objects.filter(structure_name="WATER_RESERVOIR").exists():
        Structure.objects.create(structure_name="WATER_RESERVOIR", structure_location="Example", inspection_frequency="Example", as_built_document="Example")
    
    water_reservoir_id = Structure.objects.get(structure_name="WATER_RESERVOIR").id
    if not Sensor.objects.filter(sensor_name='RE-BM').exists():
        Sensor.objects.create(sensor_name='RE-BM', sensor_model='RE', latitude=0, longitude=0, altura=0.0, cluster=99, structure_id=water_reservoir_id)
    water_reservoir_sensor_id = Sensor.objects.get(sensor_name='RE-BM').id
    for index, row in df.iterrows():
        Measurement.objects.create(
                measurement_date = row['Data'],
                sensor_data = row['Valor'],
                sensor = Sensor.objects.get(id=water_reservoir_sensor_id),
                measurement_unit = "m3",
                exit_direction = "Volume",
                manual_report = "Example",
                user = User.objects.get(id=1),
                )
