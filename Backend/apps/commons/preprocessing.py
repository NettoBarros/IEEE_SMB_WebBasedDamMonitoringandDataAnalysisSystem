import pandas as pd
import numpy as np
import re
import os

# Rename columns
def rename_columns(df: pd.DataFrame):
    rename = {
        'Instrumento': 'Sensor',
        'Data da leitura': 'Data',
        'Valor da leitura': 'Valor',
        'Direção / saída': 'Direcao_Saida'
    }
    
    df.rename(columns = rename, inplace = True)
    print(f'Renamed columns, now: {df.columns.values}.')
    
# Handle timestamp    
def time_stamp_handling(df: pd.DataFrame, verbose = True):
    df['Data'] = pd.to_datetime(df['Data'], dayfirst = True)
    df.sort_values(by = 'Data', inplace = True)
    df.reset_index(inplace = True, drop = True) # drop old index
    if verbose:
        print(f'Timestamp: dayfirst. Sorted values')

# Handle value and unit
def split_and_add_unit(df: pd.DataFrame):
    df[['Valor', 'Unidade']] = df['Valor'].str.split(' ', expand = True)
    df.insert(3, 'Unidade', df.pop('Unidade')) # reorganização da coluna 'Unidade'
    df['Valor'] = df['Valor'].str.replace(',', '.').astype(float)
    print(f'Splitted values/units.')

    
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
        
    
    
# Adiciona um coluna 'Estado' e classifica cada medição de acordo com a cor
# df: base de dados carregada em formato de pandas.DataFrame
# r: resultado da extração de estados do arquivo PDF
# obs.1: não precisa retornar o pandas.DataFrame, pois a passagem de parâmetro de um pandas.DataFrame ocorre por referência
def add_state_col(df: pd.DataFrame, r: np.array):
    idx = []
    for v in r:
        idx.append(df.index[(df['Instrumento'] == v[0]) & (df['Data da leitura'] == v[1]) & (df['Valor da leitura'] == v[2]) & (df['Direção / saída'] == v[3])].to_list()[0])
    
    df['Estado'] = 'normal'
    df.loc[idx, 'Estado'] = r[:, -1]    

  