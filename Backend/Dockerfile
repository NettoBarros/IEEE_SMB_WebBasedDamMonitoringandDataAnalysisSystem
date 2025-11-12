FROM python:3.8

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY requirements.txt .
RUN apt update -y && apt-get install -y software-properties-common && \
    apt install -y default-jdk && \
    apt-get install -y libhdf5-dev && \
    pip install --default-timeout=100 --no-cache-dir -r requirements.txt && \
    export JAVA_HOME && \
    apt-get install -y qpdf && \
    apt-get clean

COPY . .

CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]