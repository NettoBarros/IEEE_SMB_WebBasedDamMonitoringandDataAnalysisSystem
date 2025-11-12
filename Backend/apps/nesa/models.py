from dataclasses import Field
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.db.models import Q, F

# Create your models here.
class User(AbstractUser):
    first_name = models.CharField(max_length=45)
    last_name = models.CharField(max_length=45)
    registration = models.IntegerField(unique=True)
    is_admin = models.BooleanField(default=False)
    role = models.CharField(max_length=15)
    email = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    groups = None
    name = None
    username = None
    user_permissions = None
    REQUIRED_FIELDS = []

class UAV(models.Model):
    uav_model = models.CharField(max_length=15)
    brand = models.CharField(max_length=15)
    component_list = models.CharField(max_length=45)
    manual = models.CharField(max_length=45)
    purchase_date = models.DateField()


class Structure(models.Model):
    structure_name = models.CharField(max_length=45)
    structure_location = models.CharField(max_length=45)
    inspection_frequency = models.CharField(max_length=45)
    as_built_document = models.CharField(max_length=45)


class ModelsLog(models.Model):
    user = models.ForeignKey(
        User, related_name="models_user_set", on_delete=models.CASCADE
    )
    sensor = models.ForeignKey(
        "Sensor",
        related_name="models_sensor_set",
        on_delete=models.CASCADE,
        null=True,
        default=None,
    )
    timestamp = models.DateTimeField(null=True, default=None)
    structure = models.ForeignKey(
        Structure, on_delete=models.CASCADE, null=True, blank=True
    )
    initial_date = models.DateField(null=True, default=None)
    final_date = models.DateField(null=True, default=None)


class Visual_Inspection(models.Model):
    inspection_date = models.DateTimeField()
    inspection_type = models.CharField(max_length=10, null=True, default=None)
    inspector_in_charge = models.CharField(max_length=45, null=True, default=None)
    # pre_checklist = models.TextField()
    # state = models.CharField(max_length=8)
    images = models.CharField(null=True, default=None, max_length=250)
    observations = models.TextField()

    uav = models.CharField(max_length=15, null=True, default=None)
    # uav = models.ForeignKey(UAV, related_name='visual_inspection_set', on_delete=models.DO_NOTHING)
    structure = models.ForeignKey(
        Structure,
        related_name="visual_inspection_on_structure_set",
        on_delete=models.DO_NOTHING,
    )
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)


class Machine_Learning_Report(models.Model):
    date = models.DateField()
    images = models.BinaryField()
    results = models.TextField()
    visual_inspection = models.ForeignKey(
        Visual_Inspection, related_name="report_set", on_delete=models.CASCADE
    )


class Project_Threshold(models.Model):
    class Meta:
        unique_together = ("sensor", "exit_direction")

    sensor = models.ForeignKey(
        "Sensor",
        related_name="threshold_sensor_set",
        on_delete=models.DO_NOTHING,
        default=None,
    )
    exit_direction = models.CharField(max_length=50)
    attention_threshold = models.FloatField(null=True)
    alert_threshold = models.FloatField(null=True)


class Sensor(models.Model):
    sensor_name = models.CharField(max_length=20, unique=True)
    sensor_model = models.CharField(max_length=15)
    latitude = models.FloatField(default=None)
    longitude = models.FloatField(default=None)
    altura = models.FloatField(default=None)
    cluster = models.IntegerField(default=None)
    structure = models.ForeignKey(
        Structure, related_name="sensor_set", on_delete=models.DO_NOTHING
    )
    project_threshold = models.ForeignKey(
        Project_Threshold,
        related_name="sensor_threshold_set",
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
    )


class Measurement(models.Model):
    class StateOfMeasurement(models.TextChoices):
        NORMAL = "normal", _("normal")
        ATENCAO = "atencao", _("atencao")
        ALERTA = "alerta", _("alerta")
        EMERGENCIA = "emergencia", _("emergencia")

    measurement_date = models.DateTimeField()
    measurement_unit = models.CharField(max_length=10)
    exit_direction = models.CharField(max_length=50)
    manual_report = models.TextField()
    sensor_data = models.FloatField()
    state = models.CharField(
        choices=StateOfMeasurement.choices,
        default=StateOfMeasurement.NORMAL,
        max_length=10,
    )
    sensor = models.ForeignKey(
        Sensor, related_name="measurement_sensor_set", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name="measurement_user_set", on_delete=models.CASCADE
    )
    project_attention_threshold = models.FloatField(null=True)
    project_alert_threshold = models.FloatField(null=True)
    attention_threshold = models.FloatField(null=True)
    alert_threshold = models.FloatField(null=True)

    @classmethod
    def get_threshold_metrics(cls):
        
        total = cls.objects.count()
         
        abaixo_threshold = cls.objects.filter(
            sensor_data__lt=F("attention_threshold")
        ).count()

        acima_threshold = cls.objects.filter(
            sensor_data__gte=F("alert_threshold")
        ).count() 

        return {
            "total_samples": total,
            "Abaixo_threshold": abaixo_threshold,
            "Acima_threshold": acima_threshold,
        }

class PDF_Logs(models.Model):
    pdf_name = models.CharField(max_length=50, unique=True)
    date = models.DateTimeField()


class BoxPlot(models.Model):
    # TODO! Alterar nome da classe BoxPlot para algo mais genérico
    # TODO! Verificar se campos novos estão corretos
    # Nome do Índice
    label = models.CharField(max_length=50)

    # Dados para Boxplot
    lower_whisker = models.FloatField()
    lower_quartile = models.FloatField()
    median = models.FloatField()
    upper_quartile = models.FloatField()
    upper_whisker = models.FloatField()
    means = models.FloatField()

    # Dados de Categorias
    count1 = models.FloatField()
    count2 = models.FloatField()
    count3 = models.FloatField()
    count4 = models.FloatField()
    metric = models.FloatField()

    # # Dados de Histograma
    bin1 = models.IntegerField()
    bin2 = models.IntegerField()
    bin3 = models.IntegerField()
    bin4 = models.IntegerField()
    bin5 = models.IntegerField()
    bin6 = models.IntegerField()
    bin7 = models.IntegerField()
    bin8 = models.IntegerField()
    bin9 = models.IntegerField()
    bin10 = models.IntegerField()
    bin11 = models.IntegerField()
    bin12 = models.IntegerField()
    bin13 = models.IntegerField()
    bin14 = models.IntegerField()
    bin15 = models.IntegerField()
    bin16 = models.IntegerField()
    bin17 = models.IntegerField()
    bin18 = models.IntegerField()
    bin19 = models.IntegerField()
    bin20 = models.IntegerField()

    # ID de Estrutura e Inspeção
    boxplot_structure = models.ForeignKey(
        Structure, related_name="boxplot_structure_set", on_delete=models.CASCADE
    )
    boxplot_inspection = models.ForeignKey(
        Visual_Inspection,
        related_name="boxplot_inspection_set",
        on_delete=models.CASCADE,
    )


class WaterLevels(models.Model):
    date = models.DateTimeField()
    measurement = models.FloatField(null=True)
    sensor = models.CharField(max_length=10)
    unit = models.CharField(max_length=10)
    exit_direction = models.CharField(max_length=10)
    state = models.CharField(max_length=10)
