from operator import index
from os import rename
import tabula
import pandas as pd
import numpy as np
from django.db import models
import os
import re
from django.core.files.storage import FileSystemStorage

# Converte PDF -> pandas.DataFrame
# file_path: caminho do arquivo pdf com extensão
# start: índice inicial da tabela (default é 2, pois as duas primeiras tabelas não contém medições)
# end: índice final da tabela (default é -2, pois a última tabela (-1) não contém medições)
# load_csv: carrega o arquivo csv (mais rápido)
# ext_state: extrai estado das medições
# return: retorna um pandas.DataFrame
def pdf_to_df(file_path: str, start: int = 2, end: int = -2, load_csv: bool = False) -> pd.DataFrame:
    if load_csv:
        df = csv_to_df(file_path)
        df['Data'] = df['Data'].astype('datetime64')
    else:
        df = tabula.read_pdf(file_path, lattice = True, pages = 'all', silent = True)
        df = pd.concat(df[start : end+1], axis = 0) 
    return df


def csv_to_df(file_path: str) -> pd.DataFrame:
    df = pd.read_csv(file_path + '.csv', index_col=0)
    return df

def convert_cols(df, col_names):
    for n in col_names:
        df[n] = df[n].str.replace(',','.').astype(float)

def read_locations(file_path: str) -> pd.DataFrame:
    db = pd.read_csv(file_path, delimiter = ';', index_col=0)
    convert_cols(db, ['N', 'E', 'Latitude', 'Longitude', 'Altura'])
    return db

def read_locations_from_xlsx(file_path: str) -> pd.DataFrame:
    db = pd.read_excel(file_path)
    db['Sensor'] = db['Sensor'].str.replace('‐','-').astype(str)
    db = db.set_index('Sensor')
    return db

def save_to_csv(df: pd.DataFrame, file_name):
    df.to_csv(file_name, index = True)

def save_pdf(pdf):
    file_system = FileSystemStorage()
    file_system.save('apps/nesa/files/' + pdf.name, pdf)

def add_state_col(df: pd.DataFrame, r: np.array):
    idx = []
    for v in r:
        idx.append(df.index[(df['Instrumento'] == v[0]) & (df['Data da leitura'] == v[1]) & (df['Valor da leitura'] == v[2]) & (df['Direção / saída'] == v[3])].to_list()[0])
    
    df['Estado'] = 'normal'
    df.loc[idx, 'Estado'] = r[:, -1]    

  
# Obtem apenas as medições com algum tipo de 'Estado' especificado
# df: base de dados carregada em formato de pandas.DataFrame
# r: resultado da extração de amostras com determinados estados
def get_samples(df: pd.DataFrame, states: list) -> pd.DataFrame:
    r = pd.DataFrame(columns = df.columns)    
    for state in states:
        r = pd.concat([r, df[df['Estado'] == state]], axis = 0)    
    return r    

def remove_rows_with_nan(df: pd.DataFrame):
    rows = df.shape[0]
    if df.isnull().sum().sum() > 0:
        df.dropna(inplace = True, how = 'any')
        df.reset_index(inplace = True, drop = True) # drop old index
        print(f"Removed {rows - df.shape[0]} row(s) and reset index.")
    else:
        print(f"No rows removed.")

def rename_columns(pdf_dataframe):
    rename = {
        'Instrumento': 'Sensor',
        'Data da leitura': 'Data',
        'Valor da leitura': 'Valor',
        'Direção / saída': 'Direcao_Saida'
    }
    pdf_dataframe.rename(columns=rename, inplace=True)

# Handle value and unit
def split_and_add_unit(df: pd.DataFrame):
    df[['Valor', 'Unidade']] = df['Valor'].str.split(' ', expand = True)
    df.insert(3, 'Unidade', df.pop('Unidade')) # reorganização da coluna 'Unidade'
    df['Valor'] = df['Valor'].str.replace(',', '.').astype(float)

# Handle timestamp    
def time_stamp_handling(df: pd.DataFrame):
    df['Data'] = pd.to_datetime(df['Data'], dayfirst = True)
    df.sort_values(by = 'Data', inplace = True)
    df.reset_index(inplace = True, drop = True) # drop old index

# Detecta os estados presentes em medições do arquivo PDF
# path_to_pdf: caminho do arquivo pdf com extensão
# return: uma matriz numpy contendo todas as medições com estados diferentes de 'normal'
def extract_state(path_to_pdf: str) -> list:
    out1 = path_to_pdf[:-4] + '_s.pdf'
    os.system('qpdf --qdf ' + path_to_pdf + ' ' + out1)
    
    out2 = out1[:-4] + '.txt'
    os.system('mv ' + out1 + ' ' + out2)
    
    state = {'atencao': {'1 1 0'},
               'alerta': {'1 0.647049 0', '1 0.64706 0'},
               'emergencia': {'1 0.270584 0', '1 0.27059 0'}}
    
    res = []
    with open(out2, 'rb') as f:
        contents = f.read()
        contents = contents.decode('ISO-8859-1') #'unicode_escape'

        # p = re.compile('BT[\w\s.()/:,-]*?ET[\w\s.()/:,-]*?BT[\w\s.()/:,-]*?ET\n[1 1 0|1 0.647049 0][\w\s.()/:,-]*?BT[\w\s.()/:,-]*?ET[\w\s.()/:,-]*?BT[\w\s.()/:,-]*?Tj')
        p = re.compile('1 1 0|1 0.647049 0|1 0.64706 0|1 0.270584 0|1 0.27059 0')

        for m in p.finditer(contents):
            s = contents[m.start() - 500 : m.end() + 1000]        
            # l = re.findall(r'[(]([\w\s/:,.+-]*)[)]', s)
            l = re.findall(r'[(](.*)[)]', s)
            res.append(list(map(lambda s: s.replace('\\','').strip(), l)) + [key for key, values in state.items() if m.group() in values])
    
    os.system('rm ' + out2)
    return np.array(res[:-3]) # remove the last three colors detected   

def add_state_col(df: pd.DataFrame, r: np.array):
    idx = []
    for v in r:
        idx.append(df.index[(df['Instrumento'] == v[0]) & (df['Data da leitura'] == v[1]) & (df['Valor da leitura'] == v[2]) & (df['Direção / saída'] == v[3])].to_list()[0])
    
    df['Estado'] = 'normal'
    df.loc[idx, 'Estado'] = r[:, -1]

def standardize_dataframe(pdf_dataframe):
    remove_rows_with_nan(pdf_dataframe)
    rename_columns(pdf_dataframe)
    time_stamp_handling(pdf_dataframe)
    pdf_dataframe.index = pdf_dataframe['Sensor'] # Define coluna 'Sensor' como index
    pdf_dataframe.pop('Sensor') # Remove coluna 'Sensor'
    split_and_add_unit(pdf_dataframe)