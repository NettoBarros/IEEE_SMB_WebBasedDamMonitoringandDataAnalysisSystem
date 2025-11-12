from django.contrib import admin
from django.urls import path, include
from apps.nesa.views import (
    RegisterView,
    LoginView,
    AuthenticatedView,
    RedefinePasswordView,
    ModelsView,
    UserView,
    VisualInspectionView,
    UAView,
    StructureView,
    SensorView,
    MachineLearningReportView,
    MeasurementView,
    PDFLogView,
    FiltersSensorsStructures,
    UploadOrtoimagemView,
    VisualInspectionView_alt,
    ProjectBarPlotView,
    ProjectAnomaliesView,
    LatestMeasurementsView,
    VisionMetricView,
    VisionPiePlotView,
    VisionHistogramView,
    VisionLinePlotView,
    VisionTemporalBoxPlotView,
)
from apps.nesa.views import (
    UploadPDFView,
    LinePlotView,
    BarPlotView,
    AnomaliesView,
    BoxPlotView,
    MapBox,
    Train,
    Test,
    ProjectThresholdView,
    AutomatizationView,
    MeasurementsIntervalView,
    ClusterInfoView,
)
from apps.nesa.views import SensorsNamesWithAnomaliesView, VisionBoxPlotView
from apps.nesa.views import SensorWithExitDirectionsView


urlpatterns = [
    path("nesa/register", RegisterView.as_view()),
    path("nesa/login", LoginView.as_view()),
    path("nesa/authenticated", AuthenticatedView.as_view()),
    path("nesa/redefine_password/<int:id>", RedefinePasswordView.as_view()),
    path("nesa/user", UserView.as_view()),
    path("nesa/user/<int:id>", UserView.as_view()),
    path("nesa/visual_inspection", VisualInspectionView.as_view()),
    path("nesa/visual_inspection/<int:id>", VisualInspectionView.as_view()),
    path("nesa/visual_inspection_alt", VisualInspectionView_alt.as_view()),
    path("nesa/upload_orthoimage", UploadOrtoimagemView.as_view()),
    path(
        "nesa/upload_orthoimage/<int:id>/<str:image_name>",
        UploadOrtoimagemView.as_view(),
    ),
    path("nesa/uav", UAView.as_view()),
    path("nesa/uav/<int:id>", UAView.as_view()),
    path("nesa/structure", StructureView.as_view()),
    path("nesa/structure/<int:id>", StructureView.as_view()),
    path("nesa/models", ModelsView.as_view()),
    path("nesa/models/<int:id>", ModelsView.as_view()),
    path("nesa/sensor", SensorView.as_view()),
    path("nesa/sensor/<int:id>", SensorView.as_view()),
    path("nesa/machine_learning_report", MachineLearningReportView.as_view()),
    path("nesa/machine_learning_report/<int:id>", MachineLearningReportView.as_view()),
    path("nesa/measurement", MeasurementView.as_view()),
    path("nesa/measurement/<int:id>", MeasurementView.as_view()),
    path("nesa/pdf_logs", PDFLogView.as_view()),
    path("nesa/pdf_logs/<int:id>", PDFLogView.as_view()),
    path("nesa/project_threshold", ProjectThresholdView.as_view()),
    path("nesa/project_threshold/<int:id>", ProjectThresholdView.as_view()),
    path("nesa/filters_sensors_structures", FiltersSensorsStructures.as_view()),
    path("nesa/upload_pdf", UploadPDFView.as_view()),
    path(
        "nesa/line_plot/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        LinePlotView.as_view(),
    ),
    path(
        "nesa/bar_plot/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        BarPlotView.as_view(),
    ),
    path(
        "nesa/project_bar_plot/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        ProjectBarPlotView.as_view(),
    ),
    path(
        "nesa/anomalies/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        AnomaliesView.as_view(),
    ),
    path(
        "nesa/project_anomalies/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        ProjectAnomaliesView.as_view(),
    ),
    path(
        "nesa/latest_measurements/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        LatestMeasurementsView.as_view(),
    ),
    path(
        "nesa/measurements_interval/<int:sensor_id>", MeasurementsIntervalView.as_view()
    ),
    path(
        "nesa/box_plot/<int:sensor_id>/<str:initial_time>/<str:final_time>",
        BoxPlotView.as_view(),
    ),
    path("nesa/map_box/<int:structure_id>", MapBox.as_view()),
    path("nesa/train", Train.as_view()),
    path("nesa/train/<int:sensor_id>", Train.as_view()),
    path("nesa/test", Test.as_view()),
    path("nesa/test/<int:sensor_id>", Test.as_view()),
    path(
        "nesa/get_sensors_with_anomalies/<int:structure_id>",
        SensorsNamesWithAnomaliesView.as_view(),
    ),
    path(
        "nesa/get_exit_directions/<int:sensor_id>",
        SensorWithExitDirectionsView.as_view(),
    ),
    path("nesa/automatization/<int:sensor_id>", AutomatizationView.as_view()),
    path(
        "nesa/automatization/<int:sensor_id>/<int:n_neighbours>",
        AutomatizationView.as_view(),
    ),
    path("nesa/cluster_info/<int:sensor_id>", ClusterInfoView.as_view()),
    path("nesa/vision_boxplot/<int:inspection_id>", VisionBoxPlotView.as_view()),
    path(
        "nesa/vision_metric/<int:inspection_id>/<str:label>", VisionMetricView.as_view()
    ),
    path(
        "nesa/vision_pieplot/<int:inspection_id>/<str:label>",
        VisionPiePlotView.as_view(),
    ),
    path(
        "nesa/vision_histogram/<int:inspection_id>/<str:label>",
        VisionHistogramView.as_view(),
    ),
    path(
        "nesa/vision_lineplot/<int:structure_id>/<int:inspection_id>/<str:label>",
        VisionLinePlotView.as_view(),
    ),
    path(
        "nesa/vision_temporalboxplot/<int:structure_id>/<int:inspection_id>/<str:label>",
        VisionTemporalBoxPlotView.as_view(),
    ),
]
