import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="container mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Herramientas de Optimización
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora algoritmos avanzados para resolver problemas de optimización lineal y teoría de grafos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Método Simplex Revisado</CardTitle>
              <CardDescription>
                Resuelve problemas de optimización lineal usando el método simplex con matrices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/simplex">
                <Button className="w-full">Acceder al Simplex</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Algoritmo de Floyd</CardTitle>
              <CardDescription>
                Calcula los caminos más cortos entre todos los pares de vértices en un grafo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/floyd">
                <Button className="w-full">
                  Acceder al Algoritmo de Floyd
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}