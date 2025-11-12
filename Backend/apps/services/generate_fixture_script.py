from django.core.management import call_command

def generate_fixture():
    with open('apps/nesa/files/water_level_data.json', 'w') as f:
        call_command('dumpdata', 'nesa.WaterLevels', indent=2, output=f)


