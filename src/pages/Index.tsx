import { useState } from 'react';
import InputForm from '@/components/InputForm';
import SimplexTable from '@/components/SimplexTable';
import IterationDisplay from '@/components/IterationDisplay';
import ResultDisplay from '@/components/ResultDisplay';
import { Button } from '@/components/ui/button';
import { SimplexInput, SimplexResult, ProblemType, solveSimplex } from '@/utils/simplexSolver';
import { ArrowLeft } from 'lucide-react';

type Step = 'input' | 'table' | 'result';

export default function Index() {
  const [step, setStep] = useState<Step>('input');
  const [numVariables, setNumVariables] = useState<number>(0);
  const [numConstraints, setNumConstraints] = useState<number>(0);
  const [problemType, setProblemType] = useState<ProblemType>('max');
  const [result, setResult] = useState<SimplexResult | null>(null);

  const handleInputSubmit = (vars: number, constraints: number, type: ProblemType) => {
    setNumVariables(vars);
    setNumConstraints(constraints);
    setProblemType(type);
    setStep('table');
  };

  const handleSolve = (input: SimplexInput) => {
    const simplexResult = solveSimplex(input);
    setResult(simplexResult);
    setStep('result');
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setNumVariables(0);
    setNumConstraints(0);
  };

  const handleBackToTable = () => {
    setStep('table');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Método Simplex Revisado
          </h1>
          <p className="text-muted-foreground">
            Resolución de problemas de optimización lineal con matrices
          </p>
        </div>

        {step === 'input' && (
          <InputForm onSubmit={handleInputSubmit} />
        )}

        {step === 'table' && (
          <SimplexTable
            numVariables={numVariables}
            numConstraints={numConstraints}
            problemType={problemType}
            onSolve={handleSolve}
            onBack={() => setStep('input')}
          />
        )}

        {step === 'result' && result && (
          <div className="space-y-8">
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleBackToTable}>
                <ArrowLeft className="mr-2" size={16} />
                Modificar Datos
              </Button>
              <Button onClick={handleReset}>
                Nuevo Problema
              </Button>
            </div>

            <ResultDisplay result={result} numVariables={numVariables} />

            {result.iterations.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center">Iteraciones del Método Simplex</h2>
                {result.iterations.map((iteration, index) => (
                  <IterationDisplay
                    key={index}
                    iteration={iteration}
                    isOptimal={index === result.iterations.length - 1 && result.success}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}