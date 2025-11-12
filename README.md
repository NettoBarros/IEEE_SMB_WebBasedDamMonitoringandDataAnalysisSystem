# 💧 SMB: Web-Based Dam Monitoring and Data Analysis System

**Manuscript ID**: IEEE LATAM Submission ID: 10150 **Authors**:

- Raimundo M. B. Neto
- Victor F. Souza
- Max J. L. P. Júnior
- Iury G. O. Silva
- Luiz S. S. M. Filho
- Adam D. F. Santos
- Reginaldo C. S. Filho
- Hugo P. Kuribayashi
- Carlos R. L. Francês
- João C. W. A. Costa

**Affiliation:**
- Federal University of Pará (UFPA)
- Federal University of Southern and Southeastern Pará (UNIFESSPA)

---

## 📘 General description

The **SMB** is a web application developed to support the monitoring and structural safety of dams and dikes of the **Belo Monte Hydroelectric Complex (CHBM)**.

The system integrates **Machine Learning** techniques into the **Structural Health Monitoring (SHM)** process, allowing for the **early detection of anomalies** in instrumental data and the visualization of results through an **interactive dashboard**.

---

## 🧩 Main Features

- **Anomaly Detection (Manual and Automatic)**

Uses the **Local Outlier Factor (LOF)** algorithm to identify atypical behaviors in time series measurements.

- **Instrument Correlation and Clustering**

Groups neighboring instruments based on their location (longitude, latitude, and altitude) using **K-means**.

- **Interactive Dashboard**
React interface for data visualization, graphs, and real-time anomaly reports.

- **Modular and Containerized Architecture**
Backend in Django/Python, frontend in React, and **PostgreSQL** database, orchestrated with **Docker**.

---

## 🧠 System Architecture

<img width="1055" height="742" alt="arquitetura" src="https://github.com/user-attachments/assets/739ff632-0068-42ce-b1bf-7310e6301d6e" />

---
## Instructions for project execution

**Instructions for running the application's backend and frontend are available in their respective folders in the Readme file.**

