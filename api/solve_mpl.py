from http.server import BaseHTTPRequestHandler
import json
from scipy.optimize import linprog

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Leer el body de la petición
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            # Extraer datos del problema
            c = body.get('c')
            A_ub = body.get('A_ub')
            b_ub = body.get('b_ub')
            A_eq = body.get('A_eq')
            b_eq = body.get('b_eq')
            bounds = body.get('bounds')
            
            # Resolver con HiGHS
            res = linprog(
                c,
                A_ub=A_ub,
                b_ub=b_ub,
                A_eq=A_eq,
                b_eq=b_eq,
                bounds=bounds,
                method='highs'
            )
            print(res)
            # Preparar respuesta
            response_data = {
                'success': bool(res.success),
                'status': int(res.status),
                'message': str(res.message),
                'optimal_value': float(res.fun) if res.success else None,
                'optimal_variables': res.x.tolist() if res.success else None,
                'iterations': int(res.nit) if hasattr(res, 'nit') else None
            }
            
            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        # Manejar preflight CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()