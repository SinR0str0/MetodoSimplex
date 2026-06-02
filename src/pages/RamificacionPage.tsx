import { useState } from 'react';
import { Link } from 'react-router-dom';
import RamificacionInputForm from '@/components/RamificacionInputForm';
import RamificacionTable from '@/components/RamificacionTable';
import RamificacionResultDisplay from '@/components/RamificacionResultDisplay';
import { Button } from '@/components/ui/button';
import { ProblemType, MilpInput } from '@/utils/milpTypes';
import { ArrowLeft } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

type Step = 'input' | 'table' | 'result';

interface MilpResult {
  success: boolean;
  message: string;
  optimal_value: number | null;
  optimal_variables: number[] | null;
}

export default function RamificacionPage() {
  const [step, setStep] = useState<Step>('input');
  const [numVariables, setNumVariables] = useState<number>(0);
  const [numConstraints, setNumConstraints] = useState<number>(0);
  const [problemType, setProblemType] = useState<ProblemType>('max');
  const [result, setResult] = useState<MilpResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputSubmit = (vars: number, constraints: number, type: ProblemType) => {
    setNumVariables(vars);
    setNumConstraints(constraints);
    setProblemType(type);
    setStep('table');
  };

  const handleSolve = async (input: MilpInput) => {
    setLoading(true);
    try {
      // 1. Ajustar función objetivo (SciPy siempre minimiza)
      const c = problemType === 'max' ? input.objectiveCoefficients.map(coef => -coef) : input.objectiveCoefficients;

      // 2. Separar restricciones
      const A_ub: number[][] = [], b_ub: number[] = [];
      const A_eq: number[][] = [], b_eq: number[] = [];

      input.constraints.forEach(constraint => {
        if (constraint.type === '<=') {
          A_ub.push(constraint.coefficients);
          b_ub.push(constraint.rhs);
        } else if (constraint.type === '>=') {
          A_ub.push(constraint.coefficients.map(coef => -coef));
          b_ub.push(-constraint.rhs);
        } else if (constraint.type === '=') {
          A_eq.push(constraint.coefficients);
          b_eq.push(constraint.rhs);
        }
      });

      // 3. Definir límites (bounds) e integralidad
      const bounds = input.variableTypes.map(type => {
        if (type === 'binary') return [0, 1];
        if (type === 'natural') return [1, null];
        return [0, null]; // continuous o integer
      });

      const integrality = input.variableTypes.map(type => 
        (type === 'integer' || type === 'natural' || type === 'binary') ? 1 : 0
      );

      const requestData = {
        c,
        A_ub: A_ub.length > 0 ? A_ub : null,
        b_ub: b_ub.length > 0 ? b_ub : null,
        A_eq: A_eq.length > 0 ? A_eq : null,
        b_eq: b_eq.length > 0 ? b_eq : null,
        bounds,
        integrality
      };

      // 4. Petición al nuevo endpoint exclusivo de Python
      const response = await fetch('/api/test', { method: 'POST' });
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Error del servidor (Código ${response.status})`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("El servidor no devolvió un JSON válido. Respuesta: " + responseText);
      }

      setResult({
        success: data.success,
        message: data.message,
        optimal_value: data.optimal_value !== null ? (problemType === 'max' ? -data.optimal_value : data.optimal_value) : null,
        optimal_variables: data.optimal_variables
      });
      setStep('result');
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al conectar con Python',
        optimal_value: null,
        optimal_variables: null
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setNumVariables(0);
    setNumConstraints(0);
  };

  usePageMeta('Método de Ramificación y Acotamiento');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Método de Ramificación y Acotamiento
          </h1>
          <p className="text-muted-foreground">Resolución de problemas de Programación Lineal Entera (MILP)</p>
          <p className="font-medium">Elaborado por: Hernández Peña Angel Adrian</p>
        </div>

        {step === 'input' && <RamificacionInputForm onSubmit={handleInputSubmit} />}
        
        {step === 'table' && (
          <RamificacionTable
            numVariables={numVariables}
            numConstraints={numConstraints}
            problemType={problemType}
            onSolve={handleSolve}
            onBack={() => setStep('input')}
          />
        )}

        {step === 'result' && (
          <div className="space-y-8">
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep('table')} disabled={loading}>
                <ArrowLeft className="mr-2" size={16} /> Modificar Datos
              </Button>
              <Button onClick={handleReset} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                Nuevo Problema
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground animate-pulse">Ejecutando solver de Python (Branch & Bound)...</p>
              </div>
            ) : result && (
              <RamificacionResultDisplay result={result} numVariables={numVariables} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}