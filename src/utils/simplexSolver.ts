import { Matrix, createMatrix, multiplyMatrices, multiplyMatrixVector, calculateDeterminant, getIdentityMatrix, extractColumns, copyMatrix, createElementaryMatrix } from './matrixOperations';

export type ConstraintType = '<=' | '>=' | '=';
export type ProblemType = 'max' | 'min';

export interface SimplexInput {
  numVariables: number;
  numConstraints: number;
  problemType: ProblemType;
  objectiveCoefficients: number[];
  constraints: {
    coefficients: number[];
    type: ConstraintType;
    rhs: number;
  }[];
}

export interface IterationData {
  iteration: number;
  A: Matrix;
  b: number[];
  B: Matrix;
  Binv: Matrix;
  basicVariables: number[];
  nonBasicVariables: number[];
  CB: number[];
  XB: number[];
  Z: number;
  ZjCj: number[];
  enteringVariable: number | null;
  leavingVariable: number | null;
  detB: number;
}

export interface SimplexResult {
  success: boolean;
  message: string;
  iterations: IterationData[];
  optimalSolution?: number[];
  optimalValue?: number;
  hasMultipleSolutions?: boolean;

}

function convertToStandardForm(input: SimplexInput, phase: 'I' | 'II' = 'II'): {
  A: Matrix;
  b: number[];
  c: number[];
  numSlackVars: number;
  numArtificialVars: number;
} {
  const { numVariables, numConstraints, constraints, objectiveCoefficients, problemType } = input;

  let numSlackVars = 0;
  let numArtificialVars = 0;

  constraints.forEach(constraint => {
    if (constraint.type === '<=') {
      numSlackVars++;
    } else if (constraint.type === '>=') {
      numSlackVars++;
      numArtificialVars++;
    } else { // '='
      numArtificialVars++;
    }
  });

  const totalVars = numVariables + numSlackVars + numArtificialVars;
  const A = createMatrix(numConstraints, totalVars);
  const b: number[] = [];
  const c: number[] = [];

  if (phase === 'I') {
    // Fase I: minimizar suma de artificiales
    for (let i = 0; i < numVariables + numSlackVars; i++) c.push(0);
    for (let i = 0; i < numArtificialVars; i++) c.push(1);
  } else {
    // Fase II: función objetivo original (convertida a max)
    for (let i = 0; i < numVariables; i++) {
      c.push(problemType === 'max' ? objectiveCoefficients[i] : -objectiveCoefficients[i]);
    }
    for (let i = 0; i < numSlackVars; i++) c.push(0);
    for (let i = 0; i < numArtificialVars; i++) c.push(0);
  }

  let slackIndex = numVariables;
  let artificialIndex = numVariables + numSlackVars;

  constraints.forEach((constraint, i) => {
    for (let j = 0; j < numVariables; j++) {
      A.data[i][j] = constraint.coefficients[j];
    }

    if (constraint.type === '<=') {
      A.data[i][slackIndex] = 1;
      slackIndex++;
    } else if (constraint.type === '>=') {
      A.data[i][slackIndex] = -1;
      A.data[i][artificialIndex] = 1;
      slackIndex++;
      artificialIndex++;
    } else { // '='
      A.data[i][artificialIndex] = 1;
      artificialIndex++;
    }

    b.push(constraint.rhs);
  });

  return { A, b, c, numSlackVars, numArtificialVars };
}

function findInitialBasis(A: Matrix, numVariables: number, numSlackVars: number, numArtificialVars: number): number[] {
  const basicVariables: number[] = [];
  const totalVars = A.cols;

  for (let i = numVariables; i < totalVars; i++) {
    basicVariables.push(i);
    if (basicVariables.length === A.rows) break;
  }

  // Si no hay suficientes, usa variables originales (raro)
  if (basicVariables.length < A.rows) {
    for (let i = 0; i < numVariables && basicVariables.length < A.rows; i++) {
      if (!basicVariables.includes(i)) {
        basicVariables.push(i);
      }
    }
  }

  return basicVariables;
}

// MOTOR SIMPLEX
function solveSimplexCore(
  A: Matrix,
  b: number[],
  c: number[],
  initialBasicVariables: number[],
  problemType: 'max' | 'min'
): SimplexResult {
  try {
    const iterations: IterationData[] = [];
    const maxIterations = 100;
    const n = A.rows;

    let basicVariables = [...initialBasicVariables];
    let nonBasicVariables = Array.from({ length: A.cols }, (_, i) => i).filter(i => !basicVariables.includes(i));

    let Binv = getIdentityMatrix(n);

    for (let iter = 0; iter < maxIterations; iter++) {
      const B = extractColumns(A, basicVariables);
      const detB = calculateDeterminant(B);
      if (Math.abs(detB) < 1e-10) {
        return {
          success: false,
          message: 'Matriz base singular',
          iterations
        };
      }

      const CB = basicVariables.map(i => c[i]);
      const XB = multiplyMatrixVector(Binv, b);
      if (XB.some(x => x < -1e-6)) {
        return { success: false, message: 'Solución no factible', iterations };
      }

      let Z = 0;
      for (let i = 0; i < CB.length; i++) Z += CB[i] * XB[i];

      const ZjCj: number[] = [];
      for (let j = 0; j < A.cols; j++) {
        const column = A.data.map(row => row[j]);
        const Aj = multiplyMatrixVector(Binv, column);
        let Zj = 0;
        for (let i = 0; i < CB.length; i++) Zj += CB[i] * Aj[i];
        // Usamos Zj - Cj para ambos casos; la selección de variable entrante se basa en el signo
        ZjCj.push(Zj - c[j]);
      }

      let enteringVariable: number | null = null;
      let minZjCj = 0;
      for (const j of nonBasicVariables) {
        if (ZjCj[j] < minZjCj - 1e-6) {
          minZjCj = ZjCj[j];
          enteringVariable = j;
        }
      }

      iterations.push({
        iteration: iter,
        A: copyMatrix(A),
        b: [...b],
        B: copyMatrix(B),
        Binv: copyMatrix(Binv),
        basicVariables: [...basicVariables],
        nonBasicVariables: [...nonBasicVariables],
        CB: [...CB],
        XB: [...XB],
        Z,
        ZjCj: [...ZjCj],
        enteringVariable,
        leavingVariable: null,
        detB,
      });

      if (enteringVariable === null) {
        // 🔍 Verificar si hay soluciones múltiples
        let hasMultipleSolutions = false;
        for (const j of nonBasicVariables) {
          if (Math.abs(ZjCj[j]) < 1e-6) { // Zj - Cj ≈ 0
            hasMultipleSolutions = true;
            break;
          }
        }

        const optimalSolution = Array(A.cols).fill(0);
        for (let i = 0; i < basicVariables.length; i++) {
          optimalSolution[basicVariables[i]] = XB[i];
        }

        const finalOptimalValue = problemType === 'max' ? Z : -Z;

        return {
          success: true,
          message: hasMultipleSolutions 
            ? 'Solución óptima encontrada (múltiples soluciones)' 
            : 'Solución óptima encontrada',
          iterations,
          optimalSolution,
          optimalValue: finalOptimalValue,
          hasMultipleSolutions // 👈 Incluir en el resultado
        };
      }

      const enteringColumn = A.data.map(row => row[enteringVariable]);
      const y = multiplyMatrixVector(Binv, enteringColumn);

      let minRatio = Infinity;
      let pivotRow = -1;
      let leavingVariable: number | null = null;

      for (let i = 0; i < y.length; i++) {
        if (y[i] > 1e-6) {
          const ratio = XB[i] / y[i];
          const candidateVar = basicVariables[i]; // ← índice de la variable

          if (ratio < minRatio - 1e-6) {
            // Nuevo mínimo: actualizar todo
            minRatio = ratio;
            pivotRow = i;
            leavingVariable = candidateVar;
          } else if (Math.abs(ratio - minRatio) < 1e-6) {
            // Empate en ratio: aplicar Bland (menor índice de variable)
            if (leavingVariable === null || candidateVar < leavingVariable) {
              pivotRow = i;
              leavingVariable = candidateVar;
            }
          }
        }
      }

      if (leavingVariable === null) {
        return {
          success: false,
          message: 'Problema no acotado',
          iterations
        };
      }

      const pivotValue = y[pivotRow];
      const E = createElementaryMatrix(n, pivotRow, pivotRow, pivotValue, y);
      Binv = multiplyMatrices(E, Binv);

      basicVariables[pivotRow] = enteringVariable;
      nonBasicVariables = nonBasicVariables.filter(v => v !== enteringVariable);
      nonBasicVariables.push(leavingVariable);

      iterations[iterations.length - 1].leavingVariable = leavingVariable;
    }

    return {
      success: false,
      message: 'Máximo de iteraciones alcanzado',
      iterations
    };

  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'desconocido'}`,
      iterations: []
    };
  }
}

export function solveSimplex(input: SimplexInput): SimplexResult {
  // Convertir a forma estándar (Fase II) para contar artificiales
  const { A, b, c: cPhaseII, numSlackVars, numArtificialVars } = convertToStandardForm(input, 'II');
  
  const initialBasicVariables = findInitialBasis(A, input.numVariables, numSlackVars, numArtificialVars);

  // No hay artificiales → resolver directamente
  if (numArtificialVars === 0) {
    return solveSimplexCore(A, b, cPhaseII, initialBasicVariables, input.problemType);
  }
  alert('Hay variables artificiales, se usará el método de Dos Fases.');
  return{
    success: false,
    message: 'El método de Dos Fases no está implementado actualmente.',
    iterations: []
  }
  /*
  // Hay artificiales → usar Dos Fases

  // Fase I: minimizar W = sum(a_i)
  const { c: cPhaseI } = convertToStandardForm(input, 'I');
  const phaseIResult = solveSimplexCore(A, b, cPhaseI, initialBasicVariables, 'min');

  if (!phaseIResult.success) {
    return { ...phaseIResult, message: 'Error en Fase I: ' + phaseIResult.message };
  }

  // Verificar factibilidad
  if (phaseIResult.optimalValue! > 1e-6) {
    return { 
      success: false, 
      message: 'Problema infactible: no existe solución factible', 
      iterations: phaseIResult.iterations 
    };
  }

  // Fase II: usar la base final de la Fase I
  const finalBasicVars = phaseIResult.iterations.length > 0
    ? [...phaseIResult.iterations[phaseIResult.iterations.length - 1].basicVariables]
    : initialBasicVariables;

  const phaseIIResult = solveSimplexCore(A, b, cPhaseII, finalBasicVars, input.problemType);

  // Eliminar variables artificiales del resultado final
  if (phaseIIResult.success && phaseIIResult.optimalSolution) {
    phaseIIResult.optimalSolution = phaseIIResult.optimalSolution.slice(0, input.numVariables);
  }

  return phaseIIResult;
  */
}