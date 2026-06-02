import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MilpResult {
  success: boolean;
  message: string;
  optimal_value: number | null;
  optimal_variables: number[] | null;
}

interface RamificacionResultDisplayProps {
  result: MilpResult;
  numVariables: number;
}

export default function RamificacionResultDisplay({ result, numVariables }: RamificacionResultDisplayProps) {
  const formatNumber = (num: number): string => Math.abs(num) < 1e-10 ? '0.0000' : num.toFixed(4);

  return (
    <Card className="w-full max-w-4xl mx-auto border-emerald-200">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          {result.success ? (
            <><CheckCircle2 className="text-emerald-600" size={32} /> Solución Óptima Entera Encontrada</>
          ) : (
            <><XCircle className="text-red-600" size={32} /> Error en la Solución</>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-emerald-50 border-emerald-200' : ''}>
          <AlertTitle>Estado del Solver (Python)</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>

        {result.success && result.optimal_value !== null && result.optimal_variables && (
          <>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg space-y-4 border border-emerald-100">
              <h3 className="text-xl font-semibold">Valor Óptimo de la Función Objetivo:</h3>
              <p className="text-4xl font-bold text-emerald-700">Z = {formatNumber(result.optimal_value)}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Valores de las Variables:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {result.optimal_variables.slice(0, numVariables).map((value, i) => (
                  <div key={i} className="bg-white border-2 border-emerald-200 p-4 rounded-lg text-center shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Variable x<sub>{i + 1}</sub></p>
                    <p className="text-2xl font-bold text-emerald-700">{formatNumber(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}