# 💧 SMB: Web-Based Dam Monitoring and Data Analysis System

**Authors:**
Raimundo M. B. Neto , Victor F. Souza, Max J. L. P. Júnior, Iury G. O. Silva, Luiz S. S. M. Filho, Adam D. F. Santos, Reginaldo C. S. Filho, Hugo P. Kuribayashi, Carlos R. L. Francês , João C. W. A. Costa

**Affiliation:**
- Federal University of Pará (UFPA)
- Federal University of Southern and Southeastern Pará (UNIFESSPA)

---

## 📘 Descrição Geral

O **SMB** é uma aplicação web desenvolvida para apoiar o monitoramento e a segurança estrutural de barragens e diques do **Complexo Hidrelétrico de Belo Monte (CHBM)**.

O sistema integra técnicas de **Aprendizado de Máquina** ao processo de **Monitoramento de Integridade Estrutural (Structural Health Monitoring – SHM)**, permitindo a **detecção precoce de anomalias** em dados instrumentais e a visualização dos resultados por meio de um **dashboard interativo**.

---

## 🧩 Principais Funcionalidades

- **Detecção de Anomalias (Manual e Automática)**  
  Utiliza o algoritmo **Local Outlier Factor (LOF)** para identificar comportamentos atípicos em séries temporais de medições.

- **Correlação e Clusterização de Instrumentos**  
  Agrupa instrumentos vizinhos com base em sua localização (longitude, latitude e altura) utilizando **K-means**.

- **Dashboard Interativo**  
  Interface em React para visualização de dados, gráficos e relatórios de anomalias em tempo real.

- **Arquitetura Modular e Conteinerizada**  
  Backend em Django/Python, frontend em React e banco de dados **PostgreSQL**, orquestrados com **Docker**.

---

## 🧠 Arquitetura do Sistema

<img width="1055" height="742" alt="arquitetura" src="https://github.com/user-attachments/assets/739ff632-0068-42ce-b1bf-7310e6301d6e" />

---
## Instruções para execução do projeto

- **As instruções para a execução do Backend e Frontend da aplicação estão disponíveis em suas respectivas pastas no arquivo Readme.**

