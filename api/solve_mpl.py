import json
from scipy.optimize import linprog
from http import HTTPStatus

def handler(request):
    # 1. Validar que sea una petición POST
    if request.method != "POST":
        return {
            "statusCode": HTTPStatus.METHOD_NOT_ALLOWED,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Solo se permite el método POST"})
        }

    try:
        # 2. Parsear el cuerpo de la petición
        body = json.loads(request.body)

        # 3. Extraer los parámetros del problema de Programación Lineal
        c = body.get("c")
        A_ub = body.get("A_ub")
        b_ub = body.get("b_ub")
        A_eq = body.get("A_eq")
        b_eq = body.get("b_eq")
        bounds = body.get("bounds")

        # 4. Ejecutar el solver HiGHS (Simplex o Interior Point)
        res = linprog(
            c, 
            A_ub=A_ub, 
            b_ub=b_ub, 
            A_eq=A_eq, 
            b_eq=b_eq, 
            bounds=bounds, 
            method='highs'
        )

        # 5. Formatear la respuesta para que sea serializable en JSON
        response_data = {
            "success": bool(res.success),
            "status": int(res.status),
            "message": str(res.message),
            "optimal_value": float(res.fun) if res.success else None,
            "optimal_variables": res.x.tolist() if res.success else None,
            "iterations": int(res.nit) if hasattr(res, 'nit') else None
        }

        return {
            "statusCode": HTTPStatus.OK,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(response_data)
        }

    except json.JSONDecodeError:
        return {
            "statusCode": HTTPStatus.BAD_REQUEST,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "El cuerpo de la petición no es un JSON válido"})
        }
    except Exception as e:
        return {
            "statusCode": HTTPStatus.INTERNAL_SERVER_ERROR,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": f"Error interno: {str(e)}"})
        }