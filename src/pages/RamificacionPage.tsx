import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import RamificacionInputForm from '@/components/RamificacionInputForm';
import RamificacionTable from '@/components/RamificacionTable';
import BranchingTreeDisplay from '@/components/BranchingTreeDisplay';
import { Button } from '@/components/ui/button';
import { ProblemType, MilpInput, VariableType } from '@/utils/milpTypes';
import { getModelType } from '@/utils/modelClassifier';
import { ArrowLeft } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

type Step = 'input' | 'table' | 'result';

interface TreeNodeData {
  id: string;
  level: number;
  bounds: [number, number | null][];
  solution: { z: number; x: number[] } | null;
  status: 'pending' | 'solving' | 'feasible' | 'infeasible' | 'pruned' | 'branched';
  branchingVar: number | null;
  children: TreeNodeData[];
}

export default function RamificacionPage() {
  const [step, setStep] = useState<Step>('input');
  const [numVariables, setNumVariables] = useState<number>(0);
  const [numConstraints, setNumConstraints] = useState<number>(0);
  const [problemType, setProblemType] = useState<ProblemType>('max');
  const [problemVariableTypes, setProblemVariableTypes] = useState<VariableType[]>([]);
  
  const [tree, setTree] = useState<TreeNodeData | null>(null);
  const [zCota, setZCota] = useState<number>(-Infinity);
  const [isSolving, setIsSolving] = useState(false);
  
  // 🚨 NUEVO ESTADO: Para guardar el vector de la mejor solución
  const [bestSolutionVector, setBestSolutionVector] = useState<number[] | null>(null);

  const problemTypeRef = useRef<ProblemType>('max');
  const zCotaRef = useRef<number>(-Infinity);
  const originalC = useRef<number[]>([]);
  const originalA_ub = useRef<number[][]>([]);
  const originalB_ub = useRef<number[]>([]);
  const originalA_eq = useRef<number[][]>([]);
  const originalB_eq = useRef<number[]>([]);
  const variableTypesRef = useRef<VariableType[]>([]);

  const handleInputSubmit = (vars: number, constraints: number, type: ProblemType) => {
    setNumVariables(vars);
    setNumConstraints(constraints);
    setProblemType(type);
    problemTypeRef.current = type;
    setStep('table');
  };

  const findFractionalVar = (x: number[], types: VariableType[]): number => {
    for (let i = 0; i < x.length; i++) {
      const isRestricted = types[i] === 'integer' || types[i] === 'natural' || types[i] === 'binary';
      if (isRestricted) {
        const isInteger = Math.abs(x[i] - Math.round(x[i])) < 1e-5;
        if (!isInteger) return i;
      }
    }
    return -1;
  };

  const solveNode = async (node: TreeNodeData, currentTree: TreeNodeData): Promise<TreeNodeData> => {
    node.status = 'solving';
    setTree(JSON.parse(JSON.stringify(currentTree)));
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await fetch('/api/solve_mpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          c: originalC.current,
          A_ub: originalA_ub.current.length > 0 ? originalA_ub.current : null,
          b_ub: originalB_ub.current.length > 0 ? originalB_ub.current : null,
          A_eq: originalA_eq.current.length > 0 ? originalA_eq.current : null,
          b_eq: originalB_eq.current.length > 0 ? originalB_eq.current : null,
          bounds: node.bounds
        }),
      });

      const data = await response.json();

      if (!data.success || data.status === 2) {
        node.status = 'infeasible';
        node.solution = null;
        setTree(JSON.parse(JSON.stringify(currentTree)));
        return node;
      }

      const actualZ = problemTypeRef.current === 'max' ? -data.optimal_value : data.optimal_value;
      node.solution = { z: actualZ, x: data.optimal_variables };

      const fracVarIndex = findFractionalVar(data.optimal_variables, variableTypesRef.current);

      if (fracVarIndex === -1) {
        node.status = 'feasible';
        
        // 🚨 Verificar si mejora la cota Y guardar el vector
        let isBetter = false;
        if (problemTypeRef.current === 'max') {
          if (actualZ > zCotaRef.current) {
            isBetter = true;
          }
        } else {
          if (actualZ < zCotaRef.current) {
            isBetter = true;
          }
        }

        const isFirst = (problemTypeRef.current === 'max' && zCotaRef.current === -Infinity) ||
                        (problemTypeRef.current === 'min' && zCotaRef.current === Infinity);

        if (isBetter || isFirst) {
          zCotaRef.current = actualZ;
          setZCota(actualZ);
          setBestSolutionVector(data.optimal_variables); // 🚨 Guardar el vector
        }
        
        setTree(JSON.parse(JSON.stringify(currentTree)));
        return node;
      }

      if (problemTypeRef.current === 'max' && actualZ <= zCotaRef.current) {
        node.status = 'pruned';
        setTree(JSON.parse(JSON.stringify(currentTree)));
        return node;
      }
      if (problemTypeRef.current === 'min' && actualZ >= zCotaRef.current) {
        node.status = 'pruned';
        setTree(JSON.parse(JSON.stringify(currentTree)));
        return node;
      }

      node.status = 'branched';
      node.branchingVar = fracVarIndex;
      
      const val = data.optimal_variables[fracVarIndex];
      const isBinary = variableTypesRef.current[fracVarIndex] === 'binary';

      const leftBounds = JSON.parse(JSON.stringify(node.bounds));
      const rightBounds = JSON.parse(JSON.stringify(node.bounds));

      if (isBinary) {
        leftBounds[fracVarIndex] = [0, 0];
        rightBounds[fracVarIndex] = [1, 1];
      } else {
        leftBounds[fracVarIndex][1] = Math.floor(val);
        rightBounds[fracVarIndex][0] = Math.ceil(val);
      }

      const leftChild: TreeNodeData = {
        id: node.id + 'L',
        level: node.level + 1,
        bounds: leftBounds,
        solution: null,
        status: 'pending',
        branchingVar: null,
        children: []
      };

      const rightChild: TreeNodeData = {
        id: node.id + 'R',
        level: node.level + 1,
        bounds: rightBounds,
        solution: null,
        status: 'pending',
        branchingVar: null,
        children: []
      };

      node.children = [leftChild, rightChild];
      setTree(JSON.parse(JSON.stringify(currentTree)));

      await solveNode(leftChild, currentTree);
      await solveNode(rightChild, currentTree);

      return node;

    } catch (error) {
      console.error("Error en nodo:", error);
      node.status = 'infeasible';
      setTree(JSON.parse(JSON.stringify(currentTree)));
      return node;
    }
  };

  const handleSolve = async (input: MilpInput) => {
    variableTypesRef.current = input.variableTypes;
    setProblemVariableTypes(input.variableTypes);
    setIsSolving(true);
    setBestSolutionVector(null); // 🚨 Resetear vector
    
    const currentProblemType = problemTypeRef.current;
    
    const initialZCota = currentProblemType === 'max' ? -Infinity : Infinity;
    zCotaRef.current = initialZCota;
    setZCota(initialZCota);

    originalC.current = currentProblemType === 'max' 
      ? input.objectiveCoefficients.map(c => -c) 
      : input.objectiveCoefficients;
    
    originalA_ub.current = [];
    originalB_ub.current = [];
    originalA_eq.current = [];
    originalB_eq.current = [];

    input.constraints.forEach(constraint => {
      if (constraint.type === '<=') {
        originalA_ub.current.push(constraint.coefficients);
        originalB_ub.current.push(constraint.rhs);
      } else if (constraint.type === '>=') {
        originalA_ub.current.push(constraint.coefficients.map(c => -c));
        originalB_ub.current.push(-constraint.rhs);
      } else if (constraint.type === '=') {
        originalA_eq.current.push(constraint.coefficients);
        originalB_eq.current.push(constraint.rhs);
      }
    });

    const initialBounds: [number, number | null][] = input.variableTypes.map(type => {
      if (type === 'binary') return [0, 1];
      if (type === 'natural') return [1, null];
      return [0, null];
    });

    const rootNode: TreeNodeData = {
      id: '0',
      level: 0,
      bounds: initialBounds,
      solution: null,
      status: 'pending',
      branchingVar: null,
      children: []
    };

    setTree(rootNode);
    setStep('result');

    await solveNode(rootNode, rootNode);
    
    setIsSolving(false);
  };

  const handleReset = () => {
    setStep('input');
    setTree(null);
    setBestSolutionVector(null); // 🚨 Resetear
    const initialZCota = problemTypeRef.current === 'max' ? -Infinity : Infinity;
    zCotaRef.current = initialZCota;
    setZCota(initialZCota);
    setIsSolving(false);
  };

  usePageMeta('Método de Ramificación y Acotamiento');
  const modelType = getModelType(problemVariableTypes);

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
          <div className="flex justify-center items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold border border-emerald-200">
              Modelo: {modelType}
            </span>
            <p className="text-muted-foreground">Resolución de problemas de Programación Lineal Entera</p>
          </div>
          <p className="font-medium text-sm text-gray-500">Elaborado por: Hernández Peña Angel Adrian</p>
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
              <Button variant="outline" onClick={() => setStep('table')} disabled={isSolving}>
                <ArrowLeft className="mr-2" size={16} /> Modificar Datos
              </Button>
              <Button onClick={handleReset} disabled={isSolving} className="bg-emerald-600 hover:bg-emerald-700">
                Nuevo Problema
              </Button>
            </div>

            {isSolving && (
              <div className="text-center py-4">
                <p className="text-lg text-emerald-700 font-semibold animate-pulse">
                  Explorando árbol de soluciones...
                </p>
              </div>
            )}

            <BranchingTreeDisplay 
              tree={tree}
              variableTypes={problemVariableTypes}
              zCota={zCota}
              bestSolutionVector={bestSolutionVector}
              problemType={problemType}
            />
          </div>
        )}
      </div>
    </div>
  );
}