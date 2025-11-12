from apps.nesa.models import Sensor
from typing import Dict, List

def correlation_output(sensor: str, correlation_data: Dict[str, str], correl_calc, water_correl_calc):
    model = Sensor.objects.get(sensor_name=sensor).sensor_model
    if model == "MS":
        corr_output = [{'direcao_saida': correl_calc[i][2], 'correlation': correl_calc[i][0], 'p-value': correl_calc[i][1]} for i in range(len(correl_calc))]
        water_correl_output = [{'direcao_saida': water_correl_calc[i][2], 'water_correlation': water_correl_calc[i][0], 'water_p-value': water_correl_calc[i][1]} for i in range(len(water_correl_calc))]
        # Get the SIMPLE SUM of the correlations for sorting purposes.
        # Check if it should be the sum of the absolute values.
        corr_sum = sum([0 if corr_output[i].get('correlation') is None else corr_output[i].get('correlation') for i in range(len(corr_output))])
        corr_output.insert(0, {'base_correlation': corr_sum})

        water_corr_sum = sum([0 if water_correl_output[i].get('water_correlation') is None else water_correl_output[i].get('water_correlation') for i in range(len(water_correl_output))])
        water_correl_output.insert(0, {'base_water_correlation': water_corr_sum})

        output = {'correlation': corr_output, 'water_correlation': water_correl_output}
    else:
        corr_output = {'base_correlation': correl_calc[0][0], 'direcao_saida': correl_calc[0][2], 'correlation': correl_calc[0][0], 'p-value': correl_calc[0][1]}
        water_correl_output = {'base_water_correlation': water_correl_calc[0][0], 'direcao_saida': water_correl_calc[0][2], 'water_correlation': water_correl_calc[0][0], 'water_p-value': water_correl_calc[0][1]}
        output = {'correlation': [corr_output], 'water_correlation': [water_correl_output]}
    
    correlation_data[sensor] = output