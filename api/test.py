import json
from http import HTTPStatus

def handler(request):
    print("🚀 ¡HOLA MUNDO DESDE PYTHON!")
    return {
        "statusCode": HTTPStatus.OK,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"mensaje": "¡Python está funcionando perfectamente!"})
    }