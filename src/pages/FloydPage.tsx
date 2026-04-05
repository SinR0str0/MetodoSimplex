import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FloydPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="container mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Método de Floyd-Warshall
          </h1>
          <p className="text-xl text-muted-foreground">
            Esta herramienta está en desarrollo. Pronto podrás calcular caminos más cortos en grafos.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            El algoritmo de Floyd-Warshall encuentra los caminos más cortos entre todos los pares de vértices en un grafo ponderado.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}