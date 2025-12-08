import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { SimplexResult } from '@/utils/simplexSolver';

interface ResultDisplayProps {
  result: SimplexResult;
  numVariables: number;
}

export default function ResultDisplay({ result, numVariables }: ResultDisplayProps) {
  const formatNumber = (num: number): string => {
    return Math.abs(num) < 1e-10 ? '0.0000' : num.toFixed(4);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          {result.success ? (
            <>
              <CheckCircle2 className="text-green-600" size={32} />
              Solución Óptima
            </>
          ) : (
            <>
              <XCircle className="text-red-600" size={32} />
              Error en la Solución
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={result.success ? 'default' : 'destructive'}>
          <AlertTitle>Estado</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>

        {result.success && result.optimalSolution && result.optimalValue !== undefined && (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg space-y-4">
              <h3 className="text-xl font-semibold">Valor Óptimo de la Función Objetivo:</h3>
              <p className="text-3xl font-bold text-blue-600">
                Z = {formatNumber(result.optimalValue)}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Valores de las Variables:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {result.optimalSolution.slice(0, numVariables).map((value, i) => (
                  <div key={i} className="bg-white border-2 border-blue-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Variable x<sub>{i + 1}</sub></p>
                    <p className="text-xl font-bold text-blue-600">{formatNumber(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total de iteraciones realizadas: <Badge variant="outline">{result.iterations.length}</Badge>
              </p>
            </div>
          </>
        )}

        {!result.success && result.iterations.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Se realizaron {result.iterations.length} iteraciones antes del error.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}