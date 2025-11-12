from pydoc import visiblename
from ssl import VERIFY_DEFAULT
from sys import api_version
from rest_framework.views import APIView
import pandas as pd
import numpy as np
from apps.services.models import User, Visual_Inspection, UAV, Structure, Sensor, Measurement, Machine_Learning_Report, Anomalies
from datetime import timedelta

from apps.services.serializers import UserSerializer
from apps.services.serializers import VisualInspectionSerializer, VisualInspectionSerializer_get
from apps.services.serializers import UAVSerializer, UAVSerializer_get
from apps.services.serializers import StructureSerializer, StructureSerializer_get
from apps.services.serializers import SensorSerializer, SensorSerializer_get
from apps.services.serializers import MachineLearningReportSerializer, MachineLearningReportSerializer_get
from apps.services.serializers import MeasurementSerializer, MeasurementSerializer_get
from apps.services.serializers import AnomaliesSerializer, AnomaliesSerializer_get

from ..commons import pdf_tools
from ..commons import data_persistence_tools

from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotFound
import jwt, datetime

# FUNÇÕES DE APOIO---------------------------------------------------------------------------

def verify_token(request):
    token = request.COOKIES.get('api_authentication')
    if not token:
        raise AuthenticationFailed('Unauthenticated')
    try:
        jwt.decode(token, 'secret',  algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Unauthenticated')

def generic_post(request, serializer_object):
    verify_token(request)
    print(request.data)
    serializer = serializer_object(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

def generic_get(request, id, model_object, serializer_object, serializer_object_get=None):
    verify_token(request)
    if id:
        model = model_object.objects.filter(id=id).first()
        if model is None:
            raise NotFound('Resource not found')
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
        raise NotFound('Resource not found')
    model.delete()
    response = Response()
    response.data = {
        'message': 'success'
    }
    return response

def generic_patch(request, id, model_object, serializer_model):
    verify_token(request)
    model = model_object.objects.filter(id=id).first()
    if model is None:
        raise NotFound('Resource not found')
    serializer = serializer_model(model, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

# VIEWS PARA AUTENTICAÇÃO---------------------------------------------------------------------------

class RegisterView(APIView):
    def post(self, request):
        verify_token(request)
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class LoginView(APIView):
    def post(self, request):
        verify_token(request)
        email = request.data['email']
        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed('User not found"')
        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password')

        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        response = Response()

        response.set_cookie(key='service_authentication', value=token, httponly=True)
        response.data = {
            'jwt': token
        }

        return response

class AuthenticatedView(APIView):
    def get(self, request):
        verify_token(request)
        token = request.COOKIES.get('service_authentication')
        if not token:
            raise AuthenticationFailed('Unauthenticated')
        try:
            payload = jwt.decode(token, 'secret',  algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated')
        
        user = User.objects.filter(id=payload['id']).first()
        serializer = UserSerializer(user)
        return Response(serializer.data)

class LogoutView(APIView):
    def post(self, request):
        verify_token(request)
        response = Response()
        response.delete_cookie('service_authentication')
        response.data = {
            'message': 'success'
        }
        return response

# MODELOS DA TABELA---------------------------------------------------------------------------

class VisualInspectionView(APIView):
    def post(self, request):
        return generic_post(request, VisualInspectionSerializer)

    def get(self, request, id=None):
        return generic_get(request, id, Visual_Inspection, VisualInspectionSerializer, VisualInspectionSerializer_get)

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
        return generic_get(request, id, Structure, StructureSerializer, StructureSerializer_get)

    def delete(self, request, id=None):
        return generic_delete(request, id, Structure)
    
    def patch(self, request, id=None):
        return generic_patch(request, id, Structure, StructureSerializer)

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
        return generic_get(request, id, Measurement, MeasurementSerializer, MeasurementSerializer_get)

    def delete(self, request, id=None):
        return generic_delete(request, id, Measurement)
    
    def patch(self, request, id=None):
        return generic_patch(request, id, Measurement, MeasurementSerializer)

class MachineLearningReportView(APIView):
    def post(self, request):
        return generic_post(request, MachineLearningReportSerializer)

    def get(self, request, id=None):
        return generic_get(request, id, Machine_Learning_Report, MachineLearningReportSerializer, MachineLearningReportSerializer_get)

    def delete(self, request, id=None):
        return generic_delete(request, id, Machine_Learning_Report)
    
    def patch(self, request, id=None):
        return generic_patch(request, id, Machine_Learning_Report, MachineLearningReportSerializer)

class AnomaliesView(APIView):
    def post(self, request):
        return generic_get(request, id, Anomalies, AnomaliesSerializer, AnomaliesSerializer_get)

    def get(self, request):
        return generic_get(request, id, Anomalies, AnomaliesSerializer, AnomaliesSerializer_get)

    def delete(self, request):
        return generic_get(request, id, Anomalies)

    def patch(self, request):
        return generic_get(request, id, Anomalies, AnomaliesSerializer, AnomaliesSerializer_get)



# Upload dos dados---------------------------------------------------------------------------
class UploadPDFView(APIView):
    def post(self, request):
        verify_token(request)
        # Converte PDF para Dataframe
        pdf_dataframe = pdf_tools.pdf_to_df(request.FILES['file'])
        print('\nGot the dataframe, shape: ', pdf_dataframe.shape)
        # Padroniza Dataframe
        pdf_tools.remove_rows_with_nan(pdf_dataframe)
        pdf_tools.rename_columns(pdf_dataframe)
        print('Renamed Columns')
        pdf_tools.standardize_dataframe(pdf_dataframe)
        print('Standardized dataframe')
        # Persiste dados no banco
        data_persistence_tools.save_sensors_from_dataframe(pdf_dataframe)
        print('Did sensors persistence')
        data_persistence_tools.save_measurement_from_dataframe(pdf_dataframe, request)
        print('Did measurements persistence')
        return Response('Success\n')

# Filtra sensores por estrutura---------------------------------------------------------------------------
class FilterSensorsView(APIView):
    def get(self, request, structure_id=None):
        models = Sensor.objects.filter(structure=structure_id)
        serializer = SensorSerializer(models, many=True)
        return Response(serializer.data)

# Filtra medições------------------------------------------------------------------------------
class FilterMeasurementsView(APIView):
    def get(self, request, sensor_id, initial_time, final_time):
        verify_token(request)
        models = Measurement.objects.filter(sensor=sensor_id, measurement_date__range=[initial_time, final_time])
        models = models.order_by('measurement_date')
        serializer = MeasurementSerializer(models, many=True)

        return Response(serializer.data)
