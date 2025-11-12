from turtle import pd
from rest_framework import serializers
from .models import (
    User,
    Visual_Inspection,
    UAV,
    Machine_Learning_Report,
    Measurement,
    Sensor,
    ModelsLog,
    Structure,
    PDF_Logs,
    Project_Threshold,
    BoxPlot,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "registration",
            "is_admin",
            "role",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance


class UAVSerializer(serializers.ModelSerializer):
    class Meta:
        model = UAV
        fields = [
            "id",
            "uav_model",
            "brand",
            "component_list",
            "manual",
            "purchase_date",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class VisualInspectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visual_Inspection
        deth = 1
        fields = [
            "id",
            "inspection_date",
            "inspection_type",
            "inspector_in_charge",
            "images",
            "observations",
            "user",
            "uav",
            "structure",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class MachineLearningReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine_Learning_Report
        deth = 1
        fields = ["id", "date", "images", "results", "visual_inspection"]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class StructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Structure
        depth = 1
        fields = [
            "id",
            "structure_name",
            "structure_location",
            "inspection_frequency",
            "as_built_document",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = [
            "id",
            "sensor_name",
            "sensor_model",
            "latitude",
            "longitude",
            "cluster",
            "altura",
            "structure",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class StructureSerializer_get(serializers.ModelSerializer):
    visual_inspections = VisualInspectionSerializer(
        source="visual_inspection_on_structure_set", many=True, read_only=True
    )
    sensors = SensorSerializer(source="sensor_set", many=True, read_only=True)

    class Meta:
        model = Structure
        fields = [
            "id",
            "structure_name",
            "structure_location",
            "inspection_frequency",
            "as_built_document",
            "visual_inspections",
            "sensors",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = [
            "id",
            "measurement_date",
            "manual_report",
            "sensor_data",
            "state",
            "measurement_unit",
            "exit_direction",
            "sensor",
            "user",
            "attention_threshold",
            "alert_threshold",
            "project_attention_threshold",
            "project_alert_threshold",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class SensorSerializer_get(serializers.ModelSerializer):
    structure = StructureSerializer(many=False, read_only=True)
    measurements = MeasurementSerializer(
        source="measurement_sensor_set", many=True, read_only=True
    )

    class Meta:
        model = Sensor
        fields = [
            "id",
            "sensor_name",
            "sensor_model",
            "latitude",
            "longitude",
            "cluster",
            "altura",
            "structure",
            "measurements",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class ModelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelsLog
        depth = 1
        fields = [
            "id",
            "user",
            "timestamp",
            "sensor",
            "structure",
            "initial_date",
            "final_date",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class ModelsSerializer_get(serializers.ModelSerializer):
    user = UserSerializer(many=False, read_only=True)
    sensor = SensorSerializer(many=False, read_only=True)
    structure = StructureSerializer(many=False, read_only=True)

    class Meta:
        model = ModelsLog
        fields = ["id", "user", "timestamp", "sensor", "structure", "time_window"]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class MachineLearningReportSerializer_get(MachineLearningReportSerializer):
    visual_inspection = VisualInspectionSerializer(many=False, read_only=True)


class UAVSerializer_get(serializers.ModelSerializer):
    visual_inspections = VisualInspectionSerializer(
        source="visual_inspection_set", many=True, read_only=True
    )

    class Meta:
        model = UAV
        fields = [
            "id",
            "uav_model",
            "brand",
            "component_list",
            "manual",
            "purchase_date",
            "visual_inspections",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class VisualInspectionSerializer_get(serializers.ModelSerializer):
    report = StructureSerializer(source="report_set", many=True, read_only=True)
    user = UserSerializer(many=False, read_only=True)
    # uav = UAVSerializer(many=False, read_only=True)
    structure = StructureSerializer(many=False, read_only=True)

    class Meta:
        model = Visual_Inspection
        fields = [
            "id",
            "inspection_date",
            "inspection_type",
            "images",
            "observations",
            "user",
            "uav",
            "structure",
            "report",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class MeasurementSerializer_get(MeasurementSerializer):
    sensor = SensorSerializer(many=False, read_only=True)
    user = UserSerializer(many=False, read_only=True)


class PDFLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDF_Logs
        fields = ["id", "pdf_name", "date"]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class ProjectThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project_Threshold
        fields = [
            "id",
            "sensor",
            "exit_direction",
            "attention_threshold",
            "alert_threshold",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance


class ProjectThresholdSerializer_get(ProjectThresholdSerializer):
    sensor = SensorSerializer(many=False, read_only=True)


class BoxPlotSerializer(serializers.ModelSerializer):
    inspection = VisualInspectionSerializer(
        source="boxplot_sensor", many=False, read_only=True
    )
    structures = StructureSerializer(
        source="boxplot_structure", many=True, read_only=True
    )

    class Meta:
        model = BoxPlot
        fields = [
            "id",
            "label",
            "lower_whisker",
            "lower_quartile",
            "median",
            "upper_quartile",
            "upper_whisker",
            "means",
            "boxplot_structure",
            "boxplot_sensor",
            "count1",
            "count2",
            "count3",
            "count4",
            "metric",
            "bin1",
            "bin2",
            "bin3",
            "bin4",
            "bin5",
            "bin6",
            "bin7",
            "bin8",
            "bin9",
            "bin10",
            "bin11",
            "bin12",
            "bin13",
            "bin14",
            "bin15",
            "bin16",
            "bin17",
            "bin18",
            "bin19",
            "bin20",
        ]

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        instance.save()
        return instance
