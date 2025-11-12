import pandas as pd
import numpy as np
from . import preprocessing as p
import scipy.stats as stats

# Queryset to DataFrame ============================================================
def queryset_to_dataframe(queryset):
    data = list(queryset.values())
    return pd.DataFrame(data)

# Cluster definitions ==============================================================

def get_sensors_of_the_same_cluster_by_name(sensor_name, database):
    cluster_id = int(database[database['Sensor'] == sensor_name]['Cluster']) # must be an int
    sensors = list(database[database['Cluster'] == cluster_id]['Sensor']) # must be a list    
    out = {}
    for s in sensors:
        out[s] = get_distance_between_sensors(sensor_name, s, database)    
    
    return dict(sorted(out.items(), key = lambda item: item[1])) # sort by distance

def get_sensors_of_a_cluster(cluster_id, database):
    sensors = database[database['Cluster'] == cluster_id]['Sensor']
    return sensors

def get_distance_between_sensors(sensor_name_1, sensor_name_2, database):
    data_s1 = database[database['Sensor'] == sensor_name_1][['Longitude', 'Latitude', 'Altura']].values[0] # must be this way
    data_s2 = database[database['Sensor'] == sensor_name_2][['Longitude', 'Latitude', 'Altura']].values[0] # must be this way
    return np.linalg.norm(data_s1 - data_s2)





# Correlation definitions ==========================================================

def get_count(df):
    r = bvsa['Sensor'].unique()
    res = {'PZ': 0, 'PE': 0, 'MNA': 0, 'MV': 0, 'MS': 0}
    for i in r:
        if re.search('PZ.*', i):
            res['PZ'] += 1
        elif re.search('PE.*', i): 
            res['PE'] += 1
        elif re.search('MNA.*', i): 
            res['MNA'] += 1
        elif re.search('MV.*', i): 
            res['MV'] += 1
        elif re.search('MS.*', i): 
            res['MS'] += 1
    return res

def find_range(df1, df2):
    df1_min = df1['Data'].min()
    df1_max = df1['Data'].max()
    df2_min = df2['Data'].min()
    df2_max = df2['Data'].max()
    return max(df1_min, df2_min), min(df1_max, df2_max)

def get_range(df, lower, upper):
    # df[(df['Data'] >= lower) & (df['Data'] <= upper)]
    return df[df['Data'].between(lower, upper)]

def diff_samples(df1, df2):
    # out1 = df1[df1['Direcao_Saida'] == dir_saida]
    # out2 = df2[df2['Direcao_Saida'] == dir_saida]    
        
    if df1.shape[0] == df2.shape[0]:
        return True, 0, -1
    else: 
        # difference number (diff) and 
        # the df with less samples (0: left, 1: right)
        diff = df1.shape[0] - df2.shape[0]
        return False, abs(diff), 0 if diff < 0 else 1

def norm_values(df):
    den = df['Valor'].max() - df['Valor'].min()
    den = .1 if den == 0 else den # only if den equals to zero
    
    out = (df['Valor'] - df['Valor'].min()) / den
    return out

def input_data(df, n, dir_saida):
    # make sure values are sorted
    p.time_stamp_handling(df, False) 
    
    # get only dir_saida  
    out = df[df['Direcao_Saida'] == dir_saida]
    
    # input only in dir_saida
    count = 0
    while count < n: # this is require 'cause maybe one loop is not enough        
        for idx, val in enumerate(out.iloc[:-1, 2]): # although append() is being used, for will stop at -1 row position
            avg_val = (out.iloc[idx, 2] + out.iloc[idx + 1, 2]) / 2
            sensor = out.iloc[idx, 0]
            central_date = out.iloc[idx, 1] + ((out.iloc[idx + 1, 1] - out.iloc[idx, 1]) / 2)
            
            row = pd.DataFrame({'Sensor': [sensor],
                                'Data': [central_date],
                                'Valor': [avg_val],
                                'Direcao_Saida': [dir_saida],
                                'Estado': ['normal']})
                               
            out = pd.concat([out, row], ignore_index = True)
            
            count += 1
            if count == n:
                break
        p.time_stamp_handling(out, False)
        
    return out    
    
# https://realpython.com/numpy-scipy-pandas-correlation-python/
def coef(s1, s2, method = 'pearson'):
    try:
        if method == 'pearson': # Pearson's r
            return stats.pearsonr(s1, s2)
        elif method == 'spearman': # Spearman's rho
            return stats.spearmanr(s1, s2)
        elif method == 'kendall': # Kendall's tau
            return stats.kendalltau(s1, s2)
    except:
        return (None, None)
    
    
def perform_coef(df, sensor1, sensor2, dir_saida1, dir_saida2, norm = False, method = 'pearson'):
    # get time series of specified sensors
    df1 = df[df['Sensor'] == sensor1]
    df2 = df[df['Sensor'] == sensor2]
        
    # find lower and upper bounds base on both sensors
    lower, upper = find_range(df1, df2)

    # filter out of bounds measurements
    df1 = get_range(df1, lower, upper)
    df2 = get_range(df2, lower, upper)
    
    # filter those curves
    df1 = df1[df1['Direcao_Saida'] == dir_saida1]
    df2 = df2[df2['Direcao_Saida'] == dir_saida2]
    
    # specific filter for MV
    if sensor1[:2] == 'MV':
        df1 = df1[df1['Unidade'] == 'l/s']
        
    if sensor2[:2] == 'MV':
        df2 = df2[df2['Unidade'] == 'l/s']
    
    # check differences between series
    equal, n, side = diff_samples(df1, df2)
   
    # inputation of n samples in the dataframe with less samples
    if ~equal:
        if side:
            df2 = input_data(df2, n, dir_saida2)
            
        else:
            df1 = input_data(df1, n, dir_saida1)
    
    if norm:
        s1 = norm_values(df1)
        s2 = norm_values(df2)
    else:
        s1 = df1['Valor']
        s2 = df2['Valor']
    
    return coef(s1, s2, method)



def get_dir_saida(sensor):
    ds = []
    if sensor[:2] == 'PZ' or sensor[:2] == 'PE':
        ds.append('Cota Piezométrica')
        # ds.append('Carga Piezométrica') # removido propositalmente
        
    elif sensor[:2] == 'PA':
        ds.append('Cota NA')
        
    elif sensor[:3] == 'MNA':
        ds.append('Cota do NA')
        
    elif sensor[:2] == 'MV':
        ds.append('Vazão')        
        
    elif sensor[:2] == 'MS' and sensor[-2:] == 'TC':
        ds.append('Deslocamento do Afastamento Mont(-)/Jus(+)')
        ds.append('Deslocamento da Estaca Dir(-)/Esq(+)')
        ds.append('Recalque')

    elif sensor[:2] == 'MS' and sensor[-2:] == 'ER':
        ds.append('Deslocamento Longitudinal (X)')
        ds.append('Deslocamento Transversal (Y)')
        ds.append('Recalque (Z)')
    
    elif sensor[:2] == 'RE':
        ds.append('Volume')
    
    return ds


# This method applies a correlation-based approach on two historical data from dikes.
def perform_coef2(df, sensor1, sensor2, norm = False, method = 'pearson'):
    
    # each type of sensor has a specific 'dir_saida' to work with.
    ds1 = get_dir_saida(sensor1)    
    ds2 = get_dir_saida(sensor2)
    # this list stores the results (coor, p, 'dir_saida') of each 'dir_saida' from chosen sensors
    out = []
    
    for dir1 in ds1:
        for dir2 in ds2:
            res = perform_coef(df, sensor1, sensor2, dir1, dir2, norm, method) # return a tuple
            res = list(res) # change to list
            res.append(f'{dir1}@{dir2}') # append dir_saida
            
            out.append(res) # store results
    
    return out


def perform_coef_reservoir(df, reservoir, sensor1, sensor2, norm = False, method = 'pearson'):
    #df_out = df.append(reservoir) # maybe not the best practice, but does the job
    df_out = pd.concat([df, reservoir])
    return perform_coef2(df_out, sensor1, sensor2)


def get_inputation(df, sensor1, sensor2, dir_saida1, dir_saida2):
    # get time series of specified sensors
    df1 = df[df['Sensor'] == sensor1]
    df2 = df[df['Sensor'] == sensor2]
        
    # find lower and upper bounds base on both sensors
    lower, upper = find_range(df1, df2)

    # filter out of bounds measurements
    df1 = get_range(df1, lower, upper)
    df2 = get_range(df2, lower, upper)
    
    # filter those curves
    df1 = df1[df1['Direcao_Saida'] == dir_saida1]
    df2 = df2[df2['Direcao_Saida'] == dir_saida2]
    
    # specific filter for MV
    if sensor1[:2] == 'MV':
        df1 = df1[df1['Unidade'] == 'l/s']
        
    if sensor2[:2] == 'MV':
        df2 = df2[df2['Unidade'] == 'l/s']
    
    # check differences between series
    equal, n, side = diff_samples(df1, df2)
   
    # inputation of n samples in the dataframe with less samples
    if ~equal:
        if side:
            df2 = input_data(df2, n, dir_saida2)
            
        else:
            df1 = input_data(df1, n, dir_saida1)
    
    s1 = df1['Valor']
    s2 = df2['Valor']
    
    return s1, s2