import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from scipy.optimize import linprog

class APIHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        print(f"\n{'='*60}")
        print(f"🚀 [PYTHON] ¡Petición recibida en {self.path}!")
        print(f"{'='*60}")
        
        # Solo atendemos la ruta de tu API
        if self.path == '/api/solve_mpl' or self.path == '/api/test':
            try:
                # Debug: Ver qué headers están llegando
                print(f"📋 [PYTHON] Headers recibidos:")
                for key, value in self.headers.items():
                    print(f"   {key}: {value}")
                
                # Leer el Content-Length
                content_length = int(self.headers.get('Content-Length', 0))
                print(f"📏 [PYTHON] Content-Length: {content_length}")
                
                if content_length == 0:
                    print("⚠️ [PYTHON] ¡El body está vacío!")
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "El cuerpo de la petición está vacío"}).encode('utf-8'))
                    return
                
                # Leer los datos que envía React
                post_data = self.rfile.read(content_length)
                print(f"📦 [PYTHON] Datos raw recibidos: {post_data[:200]}...")  # Primeros 200 chars
                
                # Parsear JSON
                body = json.loads(post_data.decode('utf-8'))
                print(f"📦 [PYTHON] Datos parseados: {body}")

                # Ejecutar el solver HiGHS
                print("⚙️ [PYTHON] Ejecutando linprog con método highs...")
                res = linprog(
                    body.get("c"),
                    A_ub=body.get("A_ub"),
                    b_ub=body.get("b_ub"),
                    A_eq=body.get("A_eq"),
                    b_eq=body.get("b_eq"),
                    bounds=body.get("bounds"),
                    method='highs'
                )
                
                print(f"✅ [PYTHON] Éxito: {res.success}")
                print(f"📊 [PYTHON] Valor óptimo: {res.fun}")
                print(f"📍 [PYTHON] Variables: {res.x}")

                # Preparar la respuesta para React
                response_data = {
                    "success": bool(res.success),
                    "status": int(res.status),
                    "message": str(res.message),
                    "optimal_value": float(res.fun) if res.success else None,
                    "optimal_variables": res.x.tolist() if res.success else None,
                    "iterations": int(res.nit) if hasattr(res, 'nit') else None
                }

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response_json = json.dumps(response_data)
                print(f"📤 [PYTHON] Enviando respuesta: {response_json[:200]}...")
                self.wfile.write(response_json.encode('utf-8'))

            except json.JSONDecodeError as e:
                print(f"💥 [PYTHON] Error de JSON: {str(e)}")
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"JSON inválido: {str(e)}"}).encode('utf-8'))
                
            except Exception as e:
                print(f"💥 [PYTHON] Error inesperado: {str(e)}")
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            print(f"❌ [PYTHON] Ruta no encontrada: {self.path}")
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🐍 Servidor Python corriendo en http://localhost:8000")
    print("Presiona Ctrl+C para detenerlo")
    print("="*60 + "\n")
    server = HTTPServer(('localhost', 8000), APIHandler)
    server.serve_forever()