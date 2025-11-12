# North-Energy-Project

<!---These are examples. See. https://shields.io for other people or to customize this set of shields. You may want to include dependencies, project status, and license information here.--->
> Repository for an API, developed for the project "SHM-based strategies,
> Machine and Deep Learning for pattern extraction in critical structures of the Belo Monte Hydroelectric Plant".
> Built in Python, using the Django framework and the PostgreSQL database.


## 💻 Requirements

Before you begin, make sure you have installed the following resources (Linux):
* Docker:

```
sudo apt-get install docker.io
```

* Docker-Compose:

```
sudo apt-get install docker-compose
```

* Latest version of Python:

```
sudo apt-get install python<verificar_versão>
```
## 🚀 Installing

In order to run the project, you need to install the libraries listed in requirements.txt:
```
pip install -r requirements.txt
```

## ☕ Using the API

To use the API with Docker Compose, follow these steps:

- Build the Docker image by running this command in the project root:
```
- docker-compose up
- obs: In Docker Compose versions 2.x, the 'docker-compose' command is executed without the hyphen (-).
```
Note: When you finish building, you can press CTRL-C to release the terminal.
- Run the project without occupying the terminal as follows:
```
- docker-compose up -d
```

- To run any Django command via Docker.
```
- docker-compose exec web python manage.py <comando>
```
To check if everything is working, simply run the project and check ports 8000 (Django Web) and 5051 (pgAdmin) in your browser. For example:
```
localhost:8000
```

Now, regarding migrations and seeds:
- To create migrations:
```
docker-compose exec web python manage.py  makemigrations
```
- To populate the database with the tables contained in the migrations:
```
docker-compose exec web python manage.py migrate
```

- To populate the user table with the information contained in the Fixtures files, use the following command:
```
docker-compose exec web python manage.py loaddata user
```
- To populate the structure table with the information contained in the Fixtures files, use the following command:
```
docker-compose exec web python manage.py loaddata structure
```

- To populate the design threshold table with the information contained in the Fixtures files, you need to:
1. Access the application and load the PDF with the data related to the structure of interest. Ex: leituras_bvsa.pdf
2. Use the command:

    docker-compose exec web python manage.py loaddata project_threshold

- To clear the repository volumes (be VERY careful when using this):
```docker compose down -v```

## 🐘 Using pgAdmin to view the data
First, run the API and access the port:
```
localhost:5051
```
After that, follow these steps:
- Log in to pgAdmin using the credentials found in the "docker-compose.yml" file.
- Right-click on "servers" and select the option to register a new server.
- In the "General" tab, simply name the server as desired.
- In the "Connection" tab, fill in the fields "Host name/address", "Username", and "Password" with the information contained in the "docker-compose.yml" file.
- Click "Save".

After these steps, you will be able to view the database; you will be able to see the tables in "Schemas," if any. Additionally, you can perform PostgreSQL queries using the QueryTool.

## Other
To generate dummy data for the boxplots in the computer vision module:
1. With the back-end running, open a free terminal and run the command
```Bash
sudo docker compose exec web python manage.py shell
```
2. Once in the shell, run:
```Python
from apps.nesa.nesa-vision.helper.boxplot_mock_data_generation import insert_dummies_in_db
inset_dummies_in_db
```
> [!CAUTION]
> Do not use in production.

[⬆ Back to top](#projeto-norte-energia)
