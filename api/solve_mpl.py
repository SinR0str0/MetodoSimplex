import json

def handler(request):
    """
    Función handler para Vercel Serverless Functions
    """
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Solo se permite POST'})
        }
    
    try:
        # Leer el body de la petición
        body = json.loads(request.body)
        
        response_data = {
            'success': True,
            'message': '¡Python funciona en Vercel con pyproject.toml!',
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