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
  elementaryMatrices?: Matrix[];
}

export interface SimplexResult {
  success: boolean;
  message: string;
  iterations: IterationData[];
  optimalSolution?: number[];
  optimalValue?: number;
}

function convertToStandardForm(input: SimplexInput, phase : 'I'|'II'='II'): {
  A: Matrix;
  b: number[];
  c: number[];
  numSlackVars: number;
  numArtificialVars: number;
} {
  const { numVariables, numConstraints, constraints, objectiveCoefficients, problemType } = input;

  let numSlackVars = 0;
  let numArtificialVars = 0;

  // Contar variables de holgura y artificiales
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
    // Fase I: penalizar SOLO variables artificiales
    for (let i = 0; i < numVariables + numSlackVars; i++) c.push(0);
    for (let i = 0; i < numArtificialVars; i++) c.push(1); // min W = sum(a_i)
  } else {
    // Fase II: función objetivo original
    for (let i = 0; i < numVariables; i++) {
      c.push(input.problemType === 'max' ? input.objectiveCoefficients[i] : -input.objectiveCoefficients[i]);
    }
    for (let i = 0; i < numSlackVars; i++) c.push(0);
    for (let i = 0; i < numArtificialVars; i++) c.push(0); // ya no penalizamos
  }

  // Construir matriz A
  let slackIndex = numVariables;
  let artificialIndex = numVariables + numSlackVars;

  constraints.forEach((constraint, i) => {
    // Coeficientes de variables originales
    for (let j = 0; j < numVariables; j++) {
      A.data[i][j] = constraint.coefficients[j];
    }

    // Agregar variables de holgura/artificiales según tipo de restricción
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

  // Intentar usar variables de holgura y artificiales como base inicial
  for (let i = numVariables; i < totalVars; i++) {
    basicVariables.push(i);
    if (basicVariables.length === A.rows) break;
  }

  return basicVariables;
}

export function solveSimplex(input: SimplexInput): SimplexResult {
  try {
    const { A, b, c, numSlackVars, numArtificialVars } = convertToStandardForm(input);
    const iterations: IterationData[] = [];
    const maxIterations = 100;

    // Encontrar base inicial
    const initialBasicVariables = findInitialBasis(A, input.numVariables, numSlackVars, numArtificialVars);
    let basicVariables = [...initialBasicVariables];
    let nonBasicVariables = Array.from({ length: A.cols }, (_, i) => i).filter(i => !basicVariables.includes(i));

    let Binv = getIdentityMatrix(A.rows);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Extraer matriz base B
      const B = extractColumns(A, basicVariables);
      const detB = calculateDeterminant(B);

      if (Math.abs(detB) < 1e-10) {
        return {
          success: false,
          message: 'Error: La matriz base es singular (determinante = 0)',
          iterations
        };
      }

      // Calcular CB (coeficientes de variables básicas)
      const CB = basicVariables.map(i => c[i]);

      // Calcular XB = B^-1 * b
      const XB = multiplyMatrixVector(Binv, b);
      if (XB.some(x => x < -1e-6)) {
        return { success: false, message: 'Error: Solución no factible', iterations };
      }

      // Calcular Z
      let Z = 0;
      for (let i = 0; i < CB.length; i++) {
        Z += CB[i] * XB[i];
      }

      // Calcular Zj - Cj para todas las variables
      const ZjCj: number[] = [];
      for (let j = 0; j < A.cols; j++) {
        const column = A.data.map(row => row[j]);
        const Aj = multiplyMatrixVector(Binv, column);
        let Zj = 0;
        for (let i = 0; i < CB.length; i++) {
          Zj += CB[i] * Aj[i];
        }
        ZjCj.push(Zj - c[j]);
      }

      // Determinar variable de entrada (más negativa para max)
      let enteringVariable: number | null = null;
      let minZjCj = 0;
      for (const j of nonBasicVariables) {
        if (ZjCj[j] < minZjCj - 1e-6) {
          minZjCj = ZjCj[j];
          enteringVariable = j;
        }
      }

      // Guardar iteración actual
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

      // Verificar optimalidad
      if (enteringVariable === null) {
        // Solución óptima encontrada
        const optimalSolution = Array(A.cols).fill(0);
        for (let i = 0; i < basicVariables.length; i++) {
          optimalSolution[basicVariables[i]] = XB[i];
        }

        return {
          success: true,
          message: 'Solución óptima encontrada',
          iterations,
          optimalSolution: optimalSolution.slice(0, input.numVariables),
          optimalValue: input.problemType === 'max' ? Z : -Z
        };
      }

      // Calcular columna de entrada
      const enteringColumn = A.data.map(row => row[enteringVariable]);
      const yj = multiplyMatrixVector(Binv, enteringColumn);

      // Determinar variable de salida (razón mínima)
      let leavingVariable: number | null = null;
      let minRatio = Infinity;
      let leavingIndex = -1;

      for (let i = 0; i < yj.length; i++) {
        if (yj[i] > 1e-6) {
          const ratio = XB[i] / yj[i];
          if (ratio < minRatio) {
            minRatio = ratio;
            leavingVariable = basicVariables[i];
            leavingIndex = i;
          }
        }
      }

      // Si no se encontró variable de salida → problema no acotado
      if (leavingVariable === null) {
        return {
          success: false,
          message: 'Error: Solución no acotada',
          iterations
        };
      }
      
      // Actualizar Binv
      const pivotValue = yj[leavingIndex];
      const E = createElementaryMatrix(A.rows, leavingIndex, leavingIndex, pivotValue, yj);
      Binv = multiplyMatrices(E, Binv);

      // Actualizar base
      basicVariables[leavingIndex] = enteringVariable;
      nonBasicVariables = nonBasicVariables.filter(v => v !== enteringVariable);
      nonBasicVariables.push(leavingVariable);

      // Registrar variable de salida en la iteración
      iterations[iterations.length - 1].leavingVariable = leavingVariable;

      
      // Actualizar variable de salida en la última iteración
      iterations[iterations.length - 1].leavingVariable = leavingVariable;

      // Actualizar base: reemplazar variable saliente por entrante
      basicVariables[leavingIndex] = enteringVariable;
      nonBasicVariables = nonBasicVariables.filter(v => v !== enteringVariable);
      nonBasicVariables.push(leavingVariable);

    }

    // Si llegamos aquí, se alcanzó el máximo de iteraciones
    return {
      success: false,
      message: 'Error: Se alcanzó el número máximo de iteraciones',
      iterations
    };

  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      iterations: []
    };
  }
}