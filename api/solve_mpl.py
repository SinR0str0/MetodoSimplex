from http.server import BaseHTTPRequestHandler
import json

def handler(request):
    """
    Función handler para Vercel Serverless Functions
    """
    # Solo aceptar POST
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Solo se permite POST'})
        }
    
    try:
        # Leer el body de la petición
        body = json.loads(request.body)
        
        # Por ahora, solo devolver un mensaje de éxito
        response_data = {
            'success': True,
            'message': '¡Python funciona en Vercel!',
            'received_data': body
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }