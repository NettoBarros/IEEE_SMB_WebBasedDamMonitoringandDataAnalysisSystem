from rest_framework.views import APIView
from apps.nesa.nesa_vision.src.data import data_upload
from apps.commons.queries import (
    return_sensors_from_cluster,
    return_all_directions_for_sensor,
)
from apps.commons.cluster_corr_util import (
    get_sensors_of_the_same_cluster_by_name,
    get_sensors_of_a_cluster,
    get_distance_between_sensors,
    queryset_to_dataframe,
    coef,
    perform_coef2,
    perform_coef_reservoir,
)
from apps.nesa.models import (
    User,
    Visual_Inspection,
    UAV,
    Structure,
    Sensor,
    Measurement,
    ModelsLog,
    Machine_Learning_Report,
    PDF_Logs,
    Project_Threshold,
    BoxPlot,
    WaterLevels,
)
from rest_framework import status
from pathlib import Path
from django.db.models import F
from django.http import JsonResponse, HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.db import transaction

from operator import attrgetter
import numpy as np
import pandas as pd
import datetime
import os

from apps.nesa.serializers import UserSerializer
from apps.nesa.serializers import (
    VisualInspectionSerializer,
    VisualInspectionSerializer_get,
)
from apps.nesa.serializers import UAVSerializer, UAVSerializer_get
from apps.nesa.serializers import StructureSerializer, StructureSerializer_get
from apps.nesa.serializers import SensorSerializer, SensorSerializer_get
from apps.nesa.serializers import (
    MachineLearningReportSerializer,
    MachineLearningReportSerializer_get,
)
from apps.nesa.serializers import MeasurementSerializer, MeasurementSerializer_get
from apps.nesa.serializers import PDFLogsSerializer
from apps.nesa.serializers import BoxPlotSerializer
from apps.nesa.serializers import ProjectThresholdSerializer
from apps.nesa.serializers import ProjectThresholdSerializer_get
from apps.nesa.serializers import ModelsSerializer, ModelsSerializer_get
from apps.services.sensor_correlation_output import correlation_output
from apps.services.queryset_utils import DataService

from ..commons import pdf_tools
from ..commons import data_persistence_tools
from ..commons import anomaly_detection_tools

from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotFound, ValidationError

# Para rodar loaddata direto do código
from django.core import management
from django.core.management.commands import loaddata

import jwt, datetime

# FUNÇÕES DE APOIO---------------------------------------------------------------------------


def verify_token(request):
    token = request.headers.get("Authorization")
    if (not token) or (token.split(" ")[0] != "Bearer") or (len(token.split(" ")) != 2):
        raise AuthenticationFailed("Authentication failed")
    try:
        token = token.split(" ")[1]
        jwt.decode(token, "secret", algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token expired")


def get_user_by_token(request):
    verify_token(request)
    token = request.headers["Authorization"].split(" ")[1]
    if not token:
        raise AuthenticationFailed("Unauthenticated")
    try:
        payload = jwt.decode(token, "secret", algorithms=["HS256"])
        user = User.objects.filter(id=payload["id"]).first()
        return user
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Unauthenticated")


def generic_post(request, serializer_object):
    verify_token(request)
    serializer = serializer_object(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


def generic_get(
    request, id, model_object, serializer_object, serializer_object_get=None
):
    verify_token(request)
    if id:
        model = model_object.objects.filter(id=id).first()
        if model is None:
            raise NotFound("Resource not found")
        if serializer_object_get:
            serializer = serializer_object_get(model)
        else:
            serializer = serializer_object(model)
        return Response(serializer.data)
    model = model_object.objects.all()
    serializer = serializer_object(model, many=True)
    return Response(serializer.data)


def generic_delete(request, id, model_object):
    verify_token(request)
    model = model_object.objects.filter(id=id).first()
    if model is None:
        raise NotFound("Resource not found")
    model.delete()
    response = Response()
    response.data = {"message": "success"}
    return response


def generic_patch(request, id, model_object, serializer_model):
    verify_token(request)
    model = model_object.objects.filter(id=id).first()
    if model is None:
        raise NotFound("Resource not found")
    serializer = serializer_model(model, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# VIEWS PARA AUTENTICAÇÃO---------------------------------------------------------------------------


class RegisterView(APIView):
    def post(self, request):
        verify_token(request)
        token = request.headers.get("Authorization").split(" ")[1]
        payload = jwt.decode(token, "secret", algorithms=["HS256"])
        user = User.objects.get(id=payload["id"])
        if not user.is_admin:
            content = {"Unauthorized": "You have to be an administrator to do this"}
            return Response(content, status=status.HTTP_401_UNAUTHORIZED)
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(APIView):
    def post(self, request):
        email = request.data["email"]
        password = request.data["password"]

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed("User not found")
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect password")

        payload = {
            "id": user.id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            "iat": datetime.datetime.utcnow(),
        }

        token = jwt.encode(payload, "secret", algorithm="HS256")

        response = Response()

        response.data = {"jwt": token}

        return response


class AuthenticatedView(APIView):
    def get(self, request):
        user = get_user_by_token(request)
        serializer = UserSerializer(user)
        return Response(serializer.data)


class RedefinePasswordView(APIView):
    def post(self, request, id):
        user = User.objects.filter(id=id).first()
        logged_user = get_user_by_token(request)

        if user is None:
            raise AuthenticationFailed("User not found")
        if logged_user.id != id:
            raise AuthenticationFailed(
                "The logged user do not have permission to change the password from this account"
            )

        if not user.check_password(request.data["old_password"]):
            raise AuthenticationFailed("Incorrect password")
        else:
            user.set_password(request.data["new_password"])
            user.save()
            return Response({"message": "success"})


# MODELOS DA TABELA---------------------------------------------------------------------------
class UserView(APIView):
    def post(self, request):
        user = get_user_by_token(request)
        if user.is_admin == True:
            serializer = UserSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            created_user = serializer.save()
            if "password" in request.data:
                if len(request.data["password"]) < 5:
                    raise ValidationError("Password must have at least 6 values")
                created_user.set_password(request.data["password"])
                created_user.save()
            return Response(serializer.data)
        else:
            raise AuthenticationFailed(
                "User %s do not have supervisor privileges" % user.first_name
            )

    def get(self, request, id=None):
        user = get_user_by_token(request)
        if user.is_admin == True:
            return generic_get(request, id, User, UserSerializer)
        else:
            raise AuthenticationFailed(
                "User %s do not have supervisor privileges" % user.first_name
            )

    def patch(self, request, id=None):
        user = get_user_by_token(request)
        if user.is_admin == True:
            if "password" in request.data:
                if len(request.data["password"]) < 5:
                    raise ValidationError("Password must have at least 6 values")
                user.set_password(request.data["password"])
                user.save()
            return generic_patch(request, id, User, UserSerializer)
        else:
            raise AuthenticationFailed(
                "User %s do not have supervisor privileges" % user.first_name
            )

    def delete(self, request, id=None):
        user = get_user_by_token(request)
        if user.is_admin == True:
            return generic_delete(request, id, User)
        else:
            raise AuthenticationFailed(
                "User %s do not have supervisor privileges" % user.first_name
            )


class VisualInspectionView(APIView):
    def post(self, request):
        return generic_post(request, VisualInspectionSerializer)

    def get(self, request, id=None):
        return generic_get(
            request,
            id,
            Visual_Inspection,
            VisualInspectionSerializer,
            VisualInspectionSerializer_get,
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, Visual_Inspection)

    def patch(self, request, id=None):
        return generic_patch(request, id, Visual_Inspection, VisualInspectionSerializer)


class VisualInspectionView_alt(APIView):
    def post(self, request):
        return generic_post(request, VisualInspectionSerializer)

    def get(self, request, id=None):
        # retorna apenas data, nome da estrutura e id da inspecao
        query_result = Visual_Inspection.objects.all().values(
            "inspection_date", "structure__structure_name", "id"
        )
        return Response(query_result)

    def delete(self, request, id=None):
        return generic_delete(request, id, Visual_Inspection)

    def patch(self, request, id=None):
        return generic_patch(request, id, Visual_Inspection, VisualInspectionSerializer)


class UAView(APIView):
    def post(self, request):
        return generic_post(request, UAVSerializer)

    def get(self, request, id=None):
        return generic_get(request, id, UAV, UAVSerializer, UAVSerializer_get)

    def delete(self, request, id=None):
        return generic_delete(request, id, UAV)

    def patch(self, request, id=None):
        return generic_patch(request, id, UAV, UAVSerializer)


class StructureView(APIView):
    def post(self, request):
        return generic_post(request, StructureSerializer)

    def get(self, request, id=None):
        return generic_get(
            request, id, Structure, StructureSerializer, StructureSerializer_get
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, Structure)

    def patch(self, request, id=None):
        return generic_patch(request, id, Structure, StructureSerializer)


class ModelsView(APIView):
    def post(self, request):
        return generic_post(request, ModelsSerializer)

    def get(self, request, id=None):
        return generic_get(
            request, id, ModelsLog, ModelsSerializer, ModelsSerializer_get
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, ModelsLog)

    def patch(self, request, id=None):
        return generic_patch(request, id, ModelsLog, ModelsSerializer)


class SensorView(APIView):
    def post(self, request):
        return generic_post(request, SensorSerializer)

    def get(self, request, id=None):
        return generic_get(request, id, Sensor, SensorSerializer, SensorSerializer_get)

    def delete(self, request, id=None):
        return generic_delete(request, id, Sensor)

    def patch(self, request, id=None):
        return generic_patch(request, id, Sensor, SensorSerializer)


class MeasurementView(APIView):
    def post(self, request):
        return generic_post(request, MeasurementSerializer)

    def get(self, request, id=None):
        return generic_get(
            request, id, Measurement, MeasurementSerializer, MeasurementSerializer_get
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, Measurement)

    def patch(self, request, id=None):
        return generic_patch(request, id, Measurement, MeasurementSerializer)


class MachineLearningReportView(APIView):
    def post(self, request):
        return generic_post(request, MachineLearningReportSerializer)

    def get(self, request, id=None):
        return generic_get(
            request,
            id,
            Machine_Learning_Report,
            MachineLearningReportSerializer,
            MachineLearningReportSerializer_get,
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, Machine_Learning_Report)

    def patch(self, request, id=None):
        return generic_patch(
            request, id, Machine_Learning_Report, MachineLearningReportSerializer
        )


class PDFLogView(APIView):
    def post(self, request):
        return generic_post(request, PDFLogsSerializer)

    def get(self, request, id=None):
        return generic_get(request, id, PDF_Logs, PDFLogsSerializer)

    def delete(self, request, id=None):
        return generic_delete(request, id, PDF_Logs)

    def patch(self, request, id=None):
        return generic_patch(request, id, PDF_Logs, PDFLogsSerializer)


class ProjectThresholdView(APIView):
    def post(self, request):
        verify_token(request)
        serializer = ProjectThresholdSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project_threshold = serializer.save()

        measurements = Measurement.objects.filter(
            sensor=project_threshold.sensor,
            exit_direction=project_threshold.exit_direction,
        )

        measurements.update(
            project_attention_threshold=project_threshold.attention_threshold,
            project_alert_threshold=project_threshold.alert_threshold,
        )

        measurements.filter(
            sensor_data__gte=project_threshold.attention_threshold
        ).update(state="atencao")
        measurements.filter(sensor_data__gte=project_threshold.alert_threshold).update(
            state="alerta"
        )

        return Response(serializer.data)

    def get(self, request, id=None):
        return_sensors_from_cluster(1)

        return generic_get(
            request,
            id,
            Project_Threshold,
            ProjectThresholdSerializer,
            ProjectThresholdSerializer_get,
        )

    def delete(self, request, id=None):
        return generic_delete(request, id, Project_Threshold)

    def patch(self, request, id=None):
        verify_token(request)
        model = Project_Threshold.objects.filter(id=id).first()
        if model is None:
            raise NotFound("Resource not found")
        serializer = ProjectThresholdSerializer(model, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project_threshold = serializer.save()

        measurements = Measurement.objects.filter(
            sensor=project_threshold.sensor.id,
            exit_direction=project_threshold.exit_direction,
        )

        measurements.update(
            project_attention_threshold=project_threshold.attention_threshold,
            project_alert_threshold=project_threshold.alert_threshold,
        )

        measurements.filter(
            sensor_data__gte=project_threshold.attention_threshold
        ).update(state="atencao")
        measurements.filter(sensor_data__gte=project_threshold.alert_threshold).update(
            state="alerta"
        )

        return Response(serializer.data)


# Upload dos dados---------------------------------------------------------------------------
class UploadPDFView(APIView):
    def post(self, request):
        verify_token(request)
        request_file = request.FILES["pdf"] if "pdf" in request.FILES else None
        if request_file:
            pdf_name = request.FILES["pdf"].name[0:-4]
            path_csv = Path("./apps/nesa/files/" + pdf_name + ".csv")
            # Converte PDF para Dataframe
            if path_csv.is_file():
                pdf_dataframe = pdf_tools.pdf_to_df(
                    "./apps/nesa/files/" + pdf_name, load_csv=True
                )
            else:
                pdf_tools.save_pdf(request_file)
                pdf_path = "./apps/nesa/files/" + pdf_name + ".pdf"
                pdf_dataframe = pdf_tools.pdf_to_df(
                    request.FILES["pdf"], load_csv=False
                )
                pdf_dataframe.reset_index(inplace=True, drop=True)  # drop old index
                matrix_with_states = pdf_tools.extract_state(pdf_path)
                Path("./apps/nesa/files/" + pdf_name + ".pdf").unlink()
                pdf_tools.add_state_col(pdf_dataframe, matrix_with_states)
                pdf_tools.standardize_dataframe(pdf_dataframe)
                file_name = "./apps/nesa/files/" + pdf_name + ".csv"
                pdf_tools.save_to_csv(pdf_dataframe, file_name)
            print(f"File loaded with shape: {pdf_dataframe.shape}.")
            # Persiste dados no banco
            data_persistence_tools.save_sensors_from_dataframe(
                pdf_dataframe, request.data["structure_id"]
            )
            print("Did sensors persistence")
            data_persistence_tools.save_measurement_from_dataframe(
                pdf_dataframe, request
            )
            print("Did measurements persistence")
            current_datetime = datetime.datetime.now()
            pdf_log = PDF_Logs.objects.create(
                pdf_name=pdf_name, date=current_datetime.strftime("%Y-%m-%d %H:%M:%S")
            )
            # # Checando se o nome do pdf já está no banco
            if pdf_name == "leituras_bvsa":
                management.call_command(
                    "loaddata", "apps/nesa/fixtures/limiares_teste.json", verbosity=0
                )
                # atualizando os limiares de projeto no model measurements de acordo com os modelos de projeto
                limiares_teste = Project_Threshold.objects.all()
                for project_threshold in limiares_teste:
                    measurements = Measurement.objects.filter(
                        sensor=project_threshold.sensor,
                        exit_direction=project_threshold.exit_direction,
                    )
                    measurements.update(
                        project_attention_threshold=project_threshold.attention_threshold,
                        project_alert_threshold=project_threshold.alert_threshold,
                    )
                    measurements.filter(
                        sensor_data__gte=project_threshold.attention_threshold
                    ).update(state="atencao")
                    measurements.filter(
                        sensor_data__gte=project_threshold.alert_threshold
                    ).update(state="alerta")
            elif pdf_name == "leituras_dique6c":
                management.call_command(
                    "loaddata", "apps/nesa/fixtures/limiares_teste_6c.json", verbosity=0
                )
                limiares_teste = Project_Threshold.objects.all()
                for project_threshold in limiares_teste:
                    measurements = Measurement.objects.filter(
                        sensor=project_threshold.sensor,
                        exit_direction=project_threshold.exit_direction,
                    )
                    measurements.update(
                        project_attention_threshold=project_threshold.attention_threshold,
                        project_alert_threshold=project_threshold.alert_threshold,
                    )
                    measurements.filter(
                        sensor_data__gte=project_threshold.attention_threshold
                    ).update(state="atencao")
                    measurements.filter(
                        sensor_data__gte=project_threshold.alert_threshold
                    ).update(state="alerta")
            pdf_log.save()
            return Response({"Sucesso": "Medições salvas com sucesso"})
        else:
            return Response({"Erro": "Campo PDF não informado"}, status=500)


# Upload Ortoimagem----------------------------------------------------------------------------
class UploadOrtoimagemView(APIView):
    def post(self, request):
        verify_token(request)
        request_file = (
            request.FILES["orthoimage"] if "orthoimage" in request.FILES else None
        )

        if request_file:
            orthoimage_name = request.FILES["orthoimage"].name

            # Check if id_update is in request.data
            if "id_update" in request.data:
                # This is an update operation
                visual_inspection = get_object_or_404(
                    Visual_Inspection, id=request.data["id_update"]
                )
                structure = visual_inspection.structure
            else:
                # This is a create operation
                date = request.data["inspection_date"]
                inspection_type = request.data["inspection_type"]
                inspector_in_charge = request.data["inspector_in_charge"]
                user = request.data["user"]
                structure = Structure.objects.get(
                    structure_name=request.data["structure"]
                )
                observations = request.data["observations"]
                uav = request.data["uav"]
                visual_inspection = Visual_Inspection.objects.create(
                    inspection_date=date,
                    inspection_type=inspection_type,
                    inspector_in_charge=inspector_in_charge,
                    # getting user from token
                    user=get_user_by_token(request),
                    structure=structure,
                    observations=observations,
                    uav=uav,
                    images=None,  # Set images to None initially
                )
            visual_inspection_path = "./apps/nesa/files/orthoimages/"
            # Now that we have an instance of Visual_Inspection, we can construct the file path
            img_directory_path = Path(
                f"{visual_inspection_path}/{structure.structure_name}/{visual_inspection.id}/{orthoimage_name}"
            )

            # Ensure the directory exists
            os.makedirs(os.path.dirname(img_directory_path), exist_ok=True)

            try:
                with transaction.atomic():
                    # Save the image to the server
                    with open(img_directory_path, "wb+") as destination:
                        for chunk in request.FILES["orthoimage"].chunks():
                            destination.write(chunk)

                    # Update the images field with the correct path
                    dir_path = os.path.dirname(img_directory_path)
                    visual_inspection.images = dir_path
                    visual_inspection.save()

                    queryset = BoxPlot.objects.all()
                    for query in queryset:
                        print(vars(query))
                    print(f"========={orthoimage_name}===========")
                    orto = data_upload.main(
                        dir_path,
                        structure_id=visual_inspection.structure.id,
                        inspection_id=visual_inspection.id,
                        filename=orthoimage_name,
                    )
                    files_in_dir = [
                        f
                        for f in os.listdir(dir_path)
                        if os.path.isfile(os.path.join(dir_path, f))
                    ]
            except Exception as e:
                # If an error occurs, delete the file and rollback the transaction
                if os.path.exists(img_directory_path):
                    os.remove(img_directory_path)
                raise e

            return JsonResponse({"dir": dir_path, "files": files_in_dir}, status=200)

        else:
            # Salvando dados em Visual_Inspection
            date = request.data["inspection_date"]
            inspector_in_charge = request.data["inspector_in_charge"]
            inspection_type = request.data["inspection_type"]
            # user = request.data['user']
            structure = Structure.objects.get(structure_name=request.data["structure"])
            observations = request.data["observations"]
            uav = request.data["uav"]
            visual_inspection = Visual_Inspection.objects.create(
                inspection_date=date,
                inspector_in_charge=inspector_in_charge,
                inspection_type=inspection_type,
                # getting user from token
                user=get_user_by_token(request),
                structure=structure,
                observations=observations,
                uav=uav,
                images="",
            )
            visual_inspection.save()
            return Response(
                {
                    "Sucesso": "Atenção: Cadastro realizado, mas arquivo de ortoimagem não recebido"
                },
                status=200,
            )  # Não precisa retornar erro aqui, pois o campo é opcional

    def get(self, request, id, image_name):
        verify_token(request)
        # retorna o arquivo de ortoimagem selecionado
        visual_inspection = Visual_Inspection.objects.get(id=id)
        orthoimage_path = visual_inspection.images
        orthoimage_name = image_name
        orthoimage_path = Path(orthoimage_path + "/" + orthoimage_name)
        if orthoimage_path.is_file():
            # retorna o arquivo de ortoimagem propriamente dito, nao um json
            return FileResponse(open(orthoimage_path, "rb"), content_type="image/png")
        else:
            return Response({"Erro": "Arquivo não encontrado"}, status=404)


# Filtra medições------------------------------------------------------------------------------
class LinePlotView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        )

        measurement_date_values = (
            query_measurements.order_by("measurement_date")
            .values("measurement_date")
            .distinct()
        )
        exit_direction_values = (
            query_measurements.order_by("exit_direction", "measurement_unit")
            .values("exit_direction", "measurement_unit")
            .distinct()
        )

        response = {
            "exit_directions": [],
            "max_value_unit": None,
            "max_value": 0,
            "min_value": 0,
            "measurements": [],
        }

        project_threshold_values = {}
        for exit_direction in exit_direction_values:
            exit_direction_value = exit_direction["exit_direction"]
            unit_value = exit_direction["measurement_unit"]
            response["exit_directions"].append(
                exit_direction_value + " (%s)" % unit_value
            )

            project_threshold_number = Project_Threshold.objects.filter(
                sensor=sensor_id, exit_direction=exit_direction_value
            ).count()
            if project_threshold_number > 0:
                project_threshold = Project_Threshold.objects.filter(
                    sensor=sensor_id, exit_direction=exit_direction_value
                ).first()
                project_threshold_values[exit_direction_value] = {
                    "attention": project_threshold.attention_threshold,
                    "alert": project_threshold.alert_threshold,
                }
                response["exit_directions"].append(
                    "Limiar de Projeto (atencao) - " + exit_direction_value
                )
                response["exit_directions"].append(
                    "Limiar de Projeto (alerta) - " + exit_direction_value
                )

            attention_threshold_number = (
                query_measurements.filter(exit_direction=exit_direction_value)
                .exclude(attention_threshold=None)
                .count()
            )
            if attention_threshold_number > 0:
                response["exit_directions"].append(
                    "Limiar de IA (atencao) - " + exit_direction_value
                )

            alert_threshold_number = (
                query_measurements.filter(exit_direction=exit_direction_value)
                .exclude(alert_threshold=None)
                .count()
            )
            if alert_threshold_number > 0:
                response["exit_directions"].append(
                    "Limiar de IA (alerta) - " + exit_direction_value
                )

        for measurement_date in measurement_date_values:
            measurement_date_value = measurement_date["measurement_date"]
            measurements = Measurement.objects.filter(
                sensor=sensor_id, measurement_date=measurement_date_value
            ).order_by("exit_direction", "measurement_unit")
            response["measurements"].append({"date": str(measurement_date_value)[0:7]})
            for measurement in measurements:
                values = [
                    measurement.sensor_data,
                    measurement.project_attention_threshold,
                    measurement.project_alert_threshold,
                    measurement.attention_threshold,
                    measurement.alert_threshold,
                ]
                biggest_value = max([i for i in values if i is not None], default=0)
                smallest_value = min([i for i in values if i is not None], default=0)
                if biggest_value > response["max_value"]:
                    response["max_value"] = biggest_value
                    response["max_value_unit"] = "%s" % (
                        measurement.exit_direction
                        + " (%s)" % measurement.measurement_unit
                    )

                if smallest_value < response["min_value"]:
                    response["min_value"] = smallest_value
                response["measurements"][-1][
                    "%s"
                    % (
                        measurement.exit_direction
                        + " (%s)" % measurement.measurement_unit
                    )
                ] = measurement.sensor_data

                if measurement.exit_direction in project_threshold_values:
                    response["measurements"][-1][
                        "Limiar de Projeto (atencao) - " + measurement.exit_direction
                    ] = project_threshold_values[measurement.exit_direction][
                        "attention"
                    ]
                    response["measurements"][-1][
                        "Limiar de Projeto (alerta) - " + measurement.exit_direction
                    ] = project_threshold_values[measurement.exit_direction]["alert"]

                if measurement.attention_threshold is not None:
                    response["measurements"][-1][
                        "Limiar de IA (atencao) - " + measurement.exit_direction
                    ] = measurement.attention_threshold
                    # para cada exit_direction checar se é maior que o limiar de atenção
                    if measurement.sensor_data > measurement.attention_threshold:
                        response["measurements"][-1][
                            "Anomalia - "
                            + measurement.exit_direction
                            + " (%s)" % measurement.measurement_unit
                        ] = measurement.sensor_data
                if measurement.alert_threshold is not None:
                    response["measurements"][-1][
                        "Limiar de IA (alerta) - " + measurement.exit_direction
                    ] = measurement.alert_threshold

        return JsonResponse(response)


# Filtra as estruturas e seus respectivos sensores
class FiltersSensorsStructures(APIView):
    def get(self, request):
        verify_token(request)
        models = Structure.objects.filter()
        serializer = StructureSerializer_get(models, many=True)

        return Response(serializer.data)


class BarPlotView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")

        sensor = Sensor.objects.get(id=sensor_id)
        response = {"sensor": sensor.sensor_name, "data": []}

        first_year = int(initial_time[0:4])
        last_year = int(final_time[0:4])
        for year in range(first_year, last_year + 1):
            normal_state_number = query_measurements.filter(
                sensor_data__lt=F("attention_threshold"), measurement_date__year=year
            ).count()
            atencao_state_number = query_measurements.filter(
                sensor_data__gt=F("attention_threshold"),
                sensor_data__lt=F("alert_threshold"),
                measurement_date__year=year,
            ).count()
            alerta_state_number = query_measurements.filter(
                sensor_data__gt=F("alert_threshold"), measurement_date__year=year
            ).count()
            if (
                normal_state_number > 0
                or atencao_state_number > 0
                or alerta_state_number > 0
            ):
                response["data"].append(
                    {
                        "date": str(year),
                        "normal": normal_state_number,
                        "atencao": atencao_state_number,
                        "alerta": alerta_state_number,
                    }
                )
        return JsonResponse(response)


class ProjectBarPlotView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")

        sensor = Sensor.objects.get(id=sensor_id)
        response = {"sensor": sensor.sensor_name, "data": []}

        first_year = int(initial_time[0:4])
        last_year = int(final_time[0:4])
        for year in range(first_year, last_year + 1):
            # [TODO] Alterar aqui para retornar os sensores que ultrapassam  os
            # limiares de projeto
            normal_state_number = query_measurements.filter(
                state="normal", measurement_date__year=year
            ).count()
            atencao_state_number = query_measurements.filter(
                sensor_data__gt=F("project_attention_threshold"),
                sensor_data__lt=F("project_alert_threshold"),
                measurement_date__year=year,
            ).count()
            alerta_state_number = query_measurements.filter(
                sensor_data__gt=F("project_alert_threshold"),
                measurement_date__year=year,
            ).count()
            if (
                normal_state_number > 0
                or atencao_state_number > 0
                or alerta_state_number > 0
            ):
                response["data"].append(
                    {
                        "date": str(year),
                        "normal": normal_state_number,
                        "atencao": atencao_state_number,
                        "alerta": alerta_state_number,
                    }
                )
        return JsonResponse(response)


class AnomaliesView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")

        sensor = Sensor.objects.get(id=sensor_id)
        response = {
            "sensor": sensor.sensor_name,
            "data": [
                {
                    "name": "Normal",
                    "value": query_measurements.filter(
                        sensor_data__lt=F("attention_threshold")
                    ).count(),
                },
                {
                    "name": "Atencao",
                    "value": query_measurements.filter(
                        sensor_data__gt=F("attention_threshold"),
                        sensor_data__lt=F("alert_threshold"),
                    ).count(),
                },
                {
                    "name": "Alerta",
                    "value": query_measurements.filter(
                        sensor_data__gt=F("alert_threshold")
                    ).count(),
                },
            ],
        }

        return JsonResponse(response)


class ProjectAnomaliesView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")

        sensor = Sensor.objects.get(id=sensor_id)
        response = {
            "sensor": sensor.sensor_name,
            "data": [
                {
                    "name": "Normal",
                    "value": query_measurements.filter(
                        sensor_data__lt=F("project_attention_threshold")
                    ).count(),
                },
                {
                    "name": "Atencao",
                    "value": query_measurements.filter(
                        sensor_data__gt=F("project_attention_threshold"),
                        sensor_data__lt=F("project_alert_threshold"),
                    ).count(),
                },
                {
                    "name": "Alerta",
                    "value": query_measurements.filter(
                        sensor_data__gt=F("project_alert_threshold")
                    ).count(),
                },
            ],
        }

        return JsonResponse(response)


class LatestMeasurementsView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")

        sensor = Sensor.objects.get(id=sensor_id)
        # returning latest measurement or project measurement, latest attention
        # or project attention, and latest alert or project alert
        last_measurement = query_measurements.last()
        last_attention = query_measurements.filter(
            sensor_data__gt=F("attention_threshold")
        ).last()
        last_project_attention = query_measurements.filter(
            sensor_data__gt=F("project_attention_threshold")
        ).last()
        last_alert = query_measurements.filter(
            sensor_data__gt=F("alert_threshold")
        ).last()
        last_project_alert = query_measurements.filter(
            sensor_data__gt=F("project_alert_threshold")
        ).last()

        response = {
            "sensor": sensor.sensor_name,
            "latest_measurement": (
                last_measurement.sensor_data
                if last_measurement and last_measurement.sensor_data
                else 0
            ),
            "latest_measurement_date": (
                last_measurement.measurement_date
                if last_measurement and last_measurement.measurement_date
                else 0
            ),
            "latest_attention": (
                last_attention.sensor_data
                if last_attention and last_attention.sensor_data
                else 0
            ),
            "latest_attention_date": (
                last_attention.measurement_date
                if last_attention and last_attention.measurement_date
                else 0
            ),
            "latest_project_attention": (
                last_project_attention.sensor_data
                if last_project_attention and last_project_attention.sensor_data
                else 0
            ),
            "latest_project_attention_date": (
                last_project_attention.measurement_date
                if last_project_attention and last_project_attention.measurement_date
                else 0
            ),
            "latest_alert": (
                last_alert.sensor_data if last_alert and last_alert.sensor_data else 0
            ),
            "latest_alert_date": (
                last_alert.measurement_date
                if last_alert and last_alert.measurement_date
                else 0
            ),
            "latest_project_alert": (
                last_project_alert.sensor_data
                if last_project_alert and last_project_alert.sensor_data
                else 0
            ),
            "latest_project_alert_date": (
                last_project_alert.measurement_date
                if last_project_alert and last_project_alert.measurement_date
                else 0
            ),
        }
        # response = {
        #     "sensor": sensor.sensor_name,
        #     "latest_measurement": query_measurements.last().sensor_data,
        #     "latest_measurement_date": query_measurements.last().measurement_date,
        #     "latest_attention": query_measurements.filter(sensor_data__gt=F('attention_threshold')).last().sensor_data,
        #     "latest_attention_date": query_measurements.filter(sensor_data__gt=F('attention_threshold')).last().measurement_date,
        #     "latest_alert": query_measurements.filter(sensor_data__gt=F('alert_threshold')).last().sensor_data,
        #     "latest_alert_date": query_measurements.filter(sensor_data__gt=F('alert_threshold')).last().measurement_date
        # }

        return JsonResponse(response)


class MeasurementsIntervalView(APIView):
    def get(self, request, sensor_id):
        verify_token(request)
        first_measurement = (
            Measurement.objects.filter(sensor=sensor_id)
            .order_by("measurement_date")
            .values_list("measurement_date", flat=True)
            .first()
        )

        last_measurement = (
            Measurement.objects.filter(sensor=sensor_id)
            .order_by("measurement_date")
            .values_list("measurement_date", flat=True)
            .last()
        )
        response = {
            "first_measurement": first_measurement,
            "last_measurement": last_measurement,
        }
        return JsonResponse(response)


class BoxPlotView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        query_measurements = Measurement.objects.filter(
            sensor=sensor_id, measurement_date__range=[initial_time, final_time]
        ).order_by("measurement_date")
        exit_direction_values = (
            query_measurements.order_by("exit_direction", "measurement_unit")
            .values("exit_direction", "measurement_unit")
            .distinct()
        )
        exit_direction = exit_direction_values[0]["exit_direction"]

        response = {"data": []}

        first_year = int(initial_time[0:4])
        last_year = int(final_time[0:4])
        for year in range(first_year, last_year + 1):
            measurements = query_measurements.filter(
                measurement_date__year=year, exit_direction=exit_direction
            )
            if measurements:
                response["data"].append({"name": str(year), "y": [], "type": "box"})
                for measurement in measurements:
                    response["data"][-1]["y"].append(measurement.sensor_data)
        return JsonResponse(response)


class MapBox(APIView):
    def get(self, request, structure_id):
        verify_token(request)
        response = {
            "data": [],
            "latitude_mean": 0,
            "longitude_mean": 0,
        }
        latidude_number = 0
        longitude_number = 0
        clusters_dicts = (
            Sensor.objects.filter(structure_id=structure_id)
            .values("cluster")
            .distinct()
        )
        for cluster_dict in clusters_dicts:
            cluster_sensors = {
                "lat": [],
                "lon": [],
                "hovertemplate": [],
                "type": "scattermapbox",
                "mode": "markers",
                "marker": {"size": 7},
                "name": "",
            }
            sensors = Sensor.objects.filter(
                cluster=cluster_dict["cluster"], structure_id=structure_id
            )
            for sensor in sensors:
                if sensor.latitude != 0 and sensor.longitude != 0:
                    response["latitude_mean"] += sensor.latitude
                    response["longitude_mean"] += sensor.longitude
                    latidude_number += 1
                    longitude_number += 1
                cluster_sensors["lat"].append(sensor.latitude)
                cluster_sensors["lon"].append(sensor.longitude)
                hover_template = (
                    "<i>Sensor<i>: %s<br><br>Latitude</i>: %f<br>Longitude: %f<br>A<i>ltura</i>: %f"
                    % (
                        sensor.sensor_name,
                        sensor.latitude,
                        sensor.longitude,
                        sensor.altura,
                    )
                )
                cluster_sensors["hovertemplate"].append(hover_template)
                cluster_sensors["name"] = "Cluster %d" % sensor.cluster
            response["data"].append(cluster_sensors)
        response["latitude_mean"] /= latidude_number
        response["longitude_mean"] /= longitude_number
        return JsonResponse(response)


class Train(APIView):
    def post(self, request, sensor_id=None):
        verify_token(request)
        initial_date = datetime.datetime.fromisoformat(
            request.data["initial_date"].replace("Z", "")
        ).date()  # Transformando a isoDatetime apenas em data (yyyy-mm-dd)
        final_date = datetime.datetime.fromisoformat(
            request.data["final_date"].replace("Z", "")
        ).date()  # Transformando a isoDatetime apenas em data (yyyy-mm-dd)
        outlier = request.data["outlier"]
        measurements = Measurement.objects.prefetch_related("sensor")
        if sensor_id:
            measurements = measurements.filter(sensor=sensor_id)
        result = anomaly_detection_tools.train(
            measurements, initial_date, final_date, outlier
        )
        # Dados para cadastrar o modelo no registro de modelos
        user = get_user_by_token(request)
        sensor_instance = Sensor.objects.get(id=sensor_id)
        structure_instance = Structure.objects.get(id=sensor_instance.structure.id)
        timestamp = datetime.datetime.now()
        ModelsLog.objects.create(
            user=user,
            sensor=sensor_instance,
            structure=structure_instance,
            initial_date=initial_date,
            final_date=final_date,
            timestamp=timestamp,
        )
        return JsonResponse({"message": result})


class Test(APIView):
    def post(self, request, sensor_id=None):
        verify_token(request)
        initial_date = request.data["initial_date"]
        final_date = request.data["final_date"]
        outlier = request.data["outlier"]
        measurements = Measurement.objects.prefetch_related("sensor")
        if sensor_id:
            measurements = measurements.filter(sensor=sensor_id)
        predictions, messages = anomaly_detection_tools.test(
            measurements, initial_date, final_date, outlier
        )
        # instance_log = ModelsLog.objects.create(user_name=get_user_by_token(request).first_name + " " + get_user_by_token(request).last_name, sensor_name=Sensor.objects.get(id=sensor_id).sensor_name, initial_date=initial_date, final_date=final_date, timestamp=datetime.datetime.now())
        return JsonResponse({"predictions": predictions, "messages": messages})


class SensorsNamesWithAnomaliesView(APIView):
    def get(self, request, structure_id):
        verify_token(request)
        response = {"sensors": []}
        sensor_query = Sensor.objects.filter(structure=structure_id).order_by(
            "sensor_name"
        )
        for sensor in sensor_query:
            measurements_with_anomalies_number = (
                Measurement.objects.filter(sensor=sensor.id)
                .exclude(state="normal")
                .count()
            )
            if measurements_with_anomalies_number == 0:
                response["sensors"].append(
                    {
                        "id": sensor.id,
                        "sensor_name": sensor.sensor_name,
                        "has_anomaly": False,
                    }
                )
            else:
                response["sensors"].append(
                    {
                        "id": sensor.id,
                        "sensor_name": sensor.sensor_name,
                        "has_anomaly": True,
                    }
                )
        return JsonResponse(response)


class SensorWithExitDirectionsView(APIView):
    def get(self, request, sensor_id):
        verify_token(request)
        response = {"resultado": []}
        query = (
            Measurement.objects.filter(sensor=sensor_id)
            .values("exit_direction")
            .distinct()
        )
        for obj in query:
            response["resultado"].append(obj["exit_direction"])
        return JsonResponse(response)


class AutomatizationView(APIView):
    def get(self, request, sensor_id, n_neighbours=None):
        verify_token(request)
        # Criando parâmetros
        cluster_id = Sensor.objects.get(id=sensor_id).cluster
        sensor_object = Sensor.objects.get(id=sensor_id)
        sensor_name = sensor_object.sensor_name
        sensor_structure = Sensor.objects.get(id=sensor_id).structure.id
        water_data_queryset = Measurement.objects.filter(
            sensor=Sensor.objects.get(sensor_name="RE-BM").id
        )
        structure_data_queryset = Measurement.objects.filter(
            sensor__structure=sensor_structure
        ).exclude(sensor__sensor_name="RE-BM")
        relevant_sensors = Sensor.objects.filter(
            cluster=cluster_id, structure=sensor_structure
        ).exclude(sensor_name=sensor_name)
        response = []

        # Montando os dados do banco em dataframes do formato requerido pelas funções de correlação
        structure_data = DataService.process_data(structure_data_queryset)
        water_data = DataService.process_data(water_data_queryset, sensor_name="RE-BM")

        # Calculando o grupo de interesse, por maior correlação ou por vizinhança
        if n_neighbours == None:
            number_of_sensors_in_cluster = Sensor.objects.filter(
                cluster=cluster_id, structure=sensor_structure
            ).count()
            n_neighbours = number_of_sensors_in_cluster

        # Calculando os sensores mais proximos de sensor_name usando latitude e longitude
        neighbours = DataService.calculate_n_closest_sensors(
            sensor_object, n_neighbours, relevant_sensors
        )
        # Adiciona o nome do sensor alvo e sua water correlation ao result
        response = DataService.generate_correlation_response(
            structure_data, water_data, sensor_name, neighbours
        )

        return JsonResponse(response)

        # left_sensor_measurements = Measurement.objects.filter(sensor=sensor_id)
        # #transformando em dataframe
        # left_sensor_measurements = queryset_to_dataframe(left_sensor_measurements)

        # #Montando dataframe onde as datas são os ids, os sensores são as colunas e os valores são os valores dos sensores
        # df_left_sensor_measurements = left_sensor_measurements.pivot(index='id', columns='sensor_id', values='sensor_data')

        # response = {
        #     "cluster": cluster_id,
        #     "sensors": [],
        # }
        # #busca os sensores relacionados ao sensor atual de acordo com o
        # #algoritmo de clusterização
        # sensors = Sensor.objects.filter(cluster=cluster_id, structure=sensor_structure)
        # #printando todos os nomes dos sensores
        # if n_neighbours == None:
        #     n_neighbours = sensors.count()
        # df = queryset_to_dataframe(sensors)
        # renamed_columns = {
        #     "sensor_name": "Sensor",
        #     "cluster": "Cluster",
        #     "latitude": "Latitude",
        #     "longitude": "Longitude",
        #     "altura": "Altura",
        #     "sensor_data": "Valor",
        #     "exit_direction": "Direção de saída",
        # }
        # df.columns = [renamed_columns.get(k,k) for k in df.columns]
        # #relevant_measurements = Measurement.objects.filter(sensor_in=sensor_names)
        # df["Distance"] = df.apply(lambda row: get_distance_between_sensors(sensor_name, row["Sensor"], df), axis=1)
        # #Pra isso funcionar, é precido consultar a tabela de measurements e pegar as series temporais dos sensores
        # df.sort_values("Distance", ascending=True, inplace=True)
        # df.drop(df.index[0], inplace=True)
        # neighbour_names = df.Sensor.tolist()
        # neighbour_names.append(sensor_name)
        # neighbour_ids = Sensor.objects.filter(sensor_name__in=neighbour_names).values_list('id', flat=True)
        # relevant_sensors = Sensor.objects.filter(sensor_name__in=neighbour_names)
        # relevant_sensors_fields = [field.name for field in relevant_sensors.model._meta.get_fields()]
        # relevant_sensors_data = [{"name": sensor.sensor_name, "id": sensor.id} for sensor in relevant_sensors]
        # id_to_name = {sensor["id"]: sensor["name"] for sensor in relevant_sensors_data}
        # relevant_measurements = Measurement.objects.all()
        # df_relevant_measurements = queryset_to_dataframe(relevant_measurements)
        # renamed_columns = {
        #     "sensor_id": "Sensor_Id",
        #     "measurement_date": "Data",
        #     "exit_direction": "Direcao_Saida",
        #     "measurement_unit": "Unidade",
        #     "state": "Estado",
        #     "sensor_data": "Valor"
        # }
        # df_relevant_measurements.columns = [renamed_columns.get(k,k) for k in df_relevant_measurements.columns]
        # df_relevant_measurements["Sensor"] = df_relevant_measurements["Sensor_Id"].map(id_to_name)
        # df_relevant_measurements = df_relevant_measurements[["Sensor", "Data", "Valor", "Unidade", "Direcao_Saida", "Estado"]]
        # #removendo os valores nulos em Sensor
        # df_relevant_measurements = df_relevant_measurements.dropna(subset=['Sensor'])
        # print("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        # print(df_relevant_measurements["Sensor"].unique())
        # correlations_data = {sensor: {"correlation": "", "p-value": "", "water_correlation": "", "water_p_value": ""} for sensor in neighbour_names}
        # reservoir_sensor = Sensor.objects.get(sensor_name="RE-BM")
        # water_data = queryset_to_dataframe(Measurement.objects.filter(sensor=reservoir_sensor.id))
        # print(water_data.columns)
        # # Isso pode virar um service
        # water_data = water_data[["measurement_date", "sensor_data", "sensor_id", "measurement_unit", "exit_direction", "state"]]
        # # Change sensor_id to get the sensor name from the Sensor model
        # water_data.sensor_id = 'RE-BM'
        # water_data = water_data.rename(columns={
        #     'measurement_date': 'Data',
        #     'sensor_data': 'Valor',
        #     'sensor_id': 'Sensor',
        #     'measurement_unit': 'Unidade',
        #     'exit_direction': 'Direcao_Saida',
        #     'state': 'Estado'
        # })
        # water_data = water_data[['Sensor', 'Data', 'Valor', 'Unidade', 'Direcao_Saida', 'Estado']]
        # # printando os valores em water_data
        # print("WATER DATA")
        # print(water_data)
        # print(reservoir_sensor)
        # for sensor in neighbour_names:
        #     correl_calc = perform_coef2(df_relevant_measurements, sensor_name, sensor)
        #     print('==========================================')
        #     print(sensor)
        #     print("Correlacao com o isntrumento atual")
        #     print(correl_calc)
        #     print(len(correl_calc))
        #     water_correl_calc = perform_coef_reservoir(df_relevant_measurements, water_data, sensor, reservoir_sensor.sensor_name)
        #     print(water_correl_calc)
        #     print("Correlacao com o nivel da agua")
        #     print(water_correl_calc)
        #     correlation_output(sensor, correlations_data, correl_calc, water_correl_calc)
        #     print(correlations_data)

        # neighbour_names.remove(sensor_name)
        # corr_coef_list = [
        #     correlations_data[sensor]["correlation"] for sensor in neighbour_names
        # ]

        # water_corr_coef_list = [
        #     correlations_data[sensor]["water_correlation"] for sensor in neighbour_names
        # ]
        # print(df)

        # df["Corr_coef"] = corr_coef_list
        # df["Water_corr_coef"] = water_corr_coef_list
        # print(df['Corr_coef'])

        # # df["Corr_coef"] = df["Sensor"].apply(lambda x: correlations_data.get(x, {"correlation": None})["correlation"])
        # # df["P_value"] = df["Sensor"].apply(lambda x: correlations_data.get(x, {"p-value": None})["p-value"])
        # # df["Water_corr_coef"] = df["Sensor"].apply(lambda x: correlations_data.get(x, {"water_correlation": None})["water_correlation"])
        # # df["Water_p_value"] = df["Sensor"].apply(lambda x: correlations_data.get(x, {"water_p_value": None})["water_p_value"])
        # #drop the first row because it is the sensor itself
        # #Criando um dicionário com os sensores mais próximos usando pandas
        # df.sort_values(by="Corr_coef", key=lambda x: x.str[0].str['base_correlation'] if not x.empty else 0, ascending=False, inplace=True)
        # df.dropna(subset=['Corr_coef'], inplace=True)
        # results = df[['id', 'Sensor', 'Distance', 'Corr_coef', "Water_corr_coef"]].head(n_neighbours).to_dict(orient='records')
        # print(results)
        # response['sensors'].append(results)
        # return JsonResponse(response)


class ClusterInfoView(APIView):
    def get(self, request, sensor_id):
        verify_token(request)
        cluster_id = Sensor.objects.get(id=sensor_id).cluster
        sensors = Sensor.objects.filter(cluster=cluster_id)
        number_of_sensors_in_cluster = sensors.count()
        sensor_data = [
            {"name": sensor.sensor_name, "id": sensor.id} for sensor in sensors
        ]
        response = {
            "cluster_id": cluster_id,
            "neighbours": number_of_sensors_in_cluster - 1,
            "sensors": sensor_data,
        }
        return JsonResponse(response, safe=False)


class VisionBoxPlotView(APIView):
    def get(self, request, inspection_id):
        verify_token(request)
        response = {"data": []}
        query = BoxPlot.objects.filter(boxplot_inspection_id=inspection_id)
        for obj in query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "lower_whisker": obj.lower_whisker,
                    "upper_whisker": obj.upper_whisker,
                    "lower_quartile": obj.lower_quartile,
                    "upper_quartile": obj.upper_quartile,
                    "means": obj.means,
                    "median": obj.median,
                }
            )
        return JsonResponse(response)


class VisionMetricView(APIView):
    def get(self, request, inspection_id, label):
        verify_token(request)
        response = {"data": []}
        query = BoxPlot.objects.filter(boxplot_inspection_id=inspection_id, label=label)
        for obj in query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "metric": obj.metric,
                }
            )
        return JsonResponse(response)


class VisionPiePlotView(APIView):
    def get(self, request, inspection_id, label):
        verify_token(request)
        response = {"data": []}
        query = BoxPlot.objects.filter(boxplot_inspection_id=inspection_id, label=label)
        for obj in query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "count1": obj.count1,
                    "count2": obj.count2,
                    "count3": obj.count3,
                    "count4": obj.count4,
                }
            )
        return JsonResponse(response)


class VisionHistogramView(APIView):
    def get(self, request, inspection_id, label):
        verify_token(request)
        response = {"data": []}
        query = BoxPlot.objects.filter(boxplot_inspection_id=inspection_id, label=label)
        for obj in query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "bin1": obj.bin1,
                    "bin2": obj.bin2,
                    "bin3": obj.bin3,
                    "bin4": obj.bin4,
                    "bin5": obj.bin5,
                    "bin6": obj.bin6,
                    "bin7": obj.bin7,
                    "bin8": obj.bin8,
                    "bin9": obj.bin9,
                    "bin10": obj.bin10,
                    "bin11": obj.bin11,
                    "bin12": obj.bin12,
                    "bin13": obj.bin13,
                    "bin14": obj.bin14,
                    "bin15": obj.bin15,
                    "bin16": obj.bin16,
                    "bin17": obj.bin17,
                    "bin18": obj.bin18,
                    "bin19": obj.bin19,
                    "bin20": obj.bin20,
                }
            )
        return JsonResponse(response)


class VisionLinePlotView(APIView):
    def get(self, request, structure_id, inspection_id, label):
        verify_token(request)
        response = {"data": []}
        query = BoxPlot.objects.filter(boxplot_structure_id=structure_id, label=label)
        for obj in query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "selected_inspection": inspection_id,
                    "date": obj.boxplot_inspection.inspection_date,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "count1": obj.count1,
                    "count2": obj.count2,
                    "count3": obj.count3,
                    "count4": obj.count4,
                }
            )
        return JsonResponse(response)


class VisionTemporalBoxPlotView(APIView):
    def get(self, request, structure_id, inspection_id, label):
        verify_token(request)
        response = {"data": []}

        current_inspection = BoxPlot.objects.filter(
            boxplot_inspection_id=inspection_id,
            label=label,
        ).first()

        current_inspection_date = current_inspection.boxplot_inspection.inspection_date

        # Constants
        # DESIRED_TOTAL = 5
        # CURRENT_COUNT = 1  # Assuming there's always a current instance

        # Calculate counts
        past_inspection_count = BoxPlot.objects.filter(
            boxplot_structure_id=structure_id,
            label=label,
            boxplot_inspection__inspection_date__lt=current_inspection_date,
        ).count()

        future_inspection_count = BoxPlot.objects.filter(
            boxplot_structure_id=structure_id,
            label=label,
            boxplot_inspection__inspection_date__gt=current_inspection_date,
        ).count()

        # Determine initial limits
        past_limit = 2
        future_limit = 2

        total_needed = 5 - 1
        # if (past_inspection_count + future_inspection_count) < total_needed:
        if past_inspection_count < 2:
            # Not enough past instances, try to fetch more future instances
            future_limit = total_needed - past_inspection_count
        elif future_inspection_count < 2:
            # Not enough future instances, try to fetch more past instances
            past_limit = total_needed - future_inspection_count

        # Fetch past instances
        past_query = BoxPlot.objects.filter(
            boxplot_structure_id=structure_id,
            label=label,
            boxplot_inspection__inspection_date__lt=current_inspection_date,
        ).order_by("-boxplot_inspection__inspection_date")[:past_limit]

        # Fetch future instances, adjusted to not include the current date
        future_query = BoxPlot.objects.filter(
            boxplot_structure_id=structure_id,
            label=label,
            boxplot_inspection__inspection_date__gt=current_inspection_date,
        ).order_by("boxplot_inspection__inspection_date")[:future_limit]

        # Combine queries
        combined_query = list(past_query) + [current_inspection] + list(future_query)

        # Populate response
        for obj in combined_query:
            response["data"].append(
                {
                    "id": obj.id,
                    "inspection": obj.boxplot_inspection_id,
                    "selected_inspection": inspection_id,
                    "date": obj.boxplot_inspection.inspection_date,
                    "structure": obj.boxplot_structure_id,
                    "label": obj.label,
                    "lower_whisker": obj.lower_whisker,
                    "upper_whisker": obj.upper_whisker,
                    "lower_quartile": obj.lower_quartile,
                    "upper_quartile": obj.upper_quartile,
                    "means": obj.means,
                    "median": obj.median,
                    "past_count": past_inspection_count,
                    "past_limit": past_limit,
                    "future_count": future_inspection_count,
                    "future_limit": future_limit,
                }
            )
        return JsonResponse(response)
