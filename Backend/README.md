# Projeto-Norte-Energia

<!---Esses são exemplos. Veja https://shields.io para outras pessoas ou para personalizar este conjunto de escudos. Você pode querer incluir dependências, status do projeto e informações de licença aqui--->
> Repositório referente a uma API, desenvolvida para o projeto "Estratégias baseadas em SHM, 
> Machine e Deep Learning para extração de padrões em estruturas críticas da UHE Belo Monte". 
> Feita em Python, utilizando o framework Django e o banco de dados PostgreSQL.


## 💻 Pré-requisitos

Antes de começar, verifique se você instalou os seguintes recursos (Linux):
* Docker:

```
sudo apt-get install docker.io
```

* Docker-Compose:

```
sudo apt-get install docker-compose
```

* Versão mais recente do Python:

```
sudo apt-get install python<verificar_versão>
```
<del>
## 🚀 Instalando

Para que seja possível executar o projeto, é necessário instalar as bibliotecas presentes no requirements.txt:

```
pip install -r requirements.txt
```
</del>

## ☕ Usando a API

Para usar a API com o Docker-Compose, siga estas etapas:

- Construa a imagem do Docker executando esse comando na raiz do projeto:
```
- docker-compose up
- obs: Nas versoes 2.x do docker compose o comando 'docker-compose' é executado sem o hifen(-)
```
Observação: Ao finalizar a construção, é possível apertar CTRL-C para liberar o terminal.
- Execute o projeto sem ocupar o terminal da seguinte forma:
```
- docker-compose up -d
```

- Para executar qualquer comando do Django pelo docker.
```
- docker-compose exec web python manage.py <comando>
```
Para checar se tudo está funcionando, basta executar o projeto e checar as portas 8000 (django web) e 5051 (pgadmin) no navegador. Por exemplo:
```
localhost:8000
```

Agora, em relação a migrations e seeds:
- Para criar migrations:
```
docker-compose exec web python manage.py  makemigrations
```
- Para povoar o banco com as tabelas contidas nas migrations:
```
docker-compose exec web python manage.py migrate
```

- Para povoar a tabela de usuários com as informações contidas nos arquivos de Fixtures, utilize o comando:
```
docker-compose exec web python manage.py loaddata user
```
- Para povoar a tabela de estruturas com as informações contidas nos arquivos de Fixtures, utilize o comando:
```
docker-compose exec web python manage.py loaddata structure
```

- ~~Para povoar a tabela de limiares de projeto com as informações contidas nos arquivos de Fixtures é preciso:~~
1. ~~Acessar a aplicação e fazer o carregamento do pdf com os dados relativos a estrutura de interesse. Ex: leituras_bvsa.pdf~~
2. ~~Utilizar o comando:~~

    ~~docker-compose exec web python manage.py loaddata project_threshold~~

- Para limpar os volumes do repositório (MUITO cuidado ao usar):
```docker compose down -v```

## 🐘 Usando pgadmin para visualizar os dados
Primeiro, execute a API e acesse a porta:
```
localhost:5051
```
Após isso, siga os seguintes passos:
- Faça login no pgadmin usando as credenciais presentes no arquivo "docker-compose.yml".
- Clique com o botão direito em "servers" e selecione a opção de registrar um novo servidor.
- Na aba "General", apenas nomeie o servidor como desejar.
- Na aba "Connection", preencha os campos, "Host name/address", "Username", e "Password" com as informações contidas no arquivo "docker-compose.yml". 
- Clique em "Save".

Ao fim dessas etapas, será possível visualizar o banco, você poderá visualizar as tabelas em "Schemas", se houverem. Além disso, é possível fazer queries PostgreSQL usando a ferramenta QuerieTool.

## Outro
Para gerar dados dummy para os boxplots do módulo de visão computacional:
1. Com o back-end rodando, abra um terminal livre e execute o comando 
```Bash
sudo docker compose exec web python manage.py shell
```
2. Uma vez no shell, execute:
```Python
from apps.nesa.nesa-vision.helper.boxplot_mock_data_generation import insert_dummies_in_db
inset_dummies_in_db
```
> [!CAUTION]
> Não usar em produção

[⬆ Voltar ao topo](#projeto-norte-energia)
