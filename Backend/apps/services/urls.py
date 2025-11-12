from django.contrib import admin
from django.urls import path, include
from apps.services.views import RegisterView, LoginView, AuthenticatedView, LogoutView, VisualInspectionView, UAView, StructureView, SensorView, MachineLearningReportView, MeasurementView, AnomaliesView
from apps.services.views import UploadPDFView, FilterMeasurementsView, FilterSensorsView

urlpatterns = [
    path('services/register', RegisterView.as_view()),
    path('services/login', LoginView.as_view()),
    path('services/authenticated', AuthenticatedView.as_view()),
    path('services/logout', LogoutView.as_view()),

    path('services/visual_inspection', VisualInspectionView.as_view()),
    path('services/visual_inspection/<int:id>', VisualInspectionView.as_view()),

    path('services/uav', UAView.as_view()),
    path('services/uav/<int:id>', UAView.as_view()),

    path('services/structure', StructureView.as_view()),
    path('services/structure/<int:id>', StructureView.as_view()),

    path('services/sensor', SensorView.as_view()),
    path('services/sensor/<int:id>', SensorView.as_view()),

    path('services/machine_learning_report', MachineLearningReportView.as_view()),
    path('services/machine_learning_report/<int:id>', MachineLearningReportView.as_view()),

    path('services/measurement', MeasurementView.as_view()),
    path('services/measurement/<int:id>', MeasurementView.as_view()),

    path('services/anomalies', AnomaliesView.as_view()),
    path('services/anomalies/<int:id>', AnomaliesView.as_view()),



    path('services/upload_pdf', UploadPDFView.as_view()),
    
    path('services/filter_sensors/<int:structure_id>', FilterSensorsView.as_view()),

    path('services/filter_measurements/<int:sensor_id>/<str:initial_time>/<str:final_time>', FilterMeasurementsView.as_view()),
    ]

