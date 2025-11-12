import { Matrix, createMatrix, multiplyMatrices, multiplyMatrixVector, calculateDeterminant, getIdentityMatrix, createElementaryMatrix, extractColumns, copyMatrix } from './matrixOperations';

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

function convertToStandardForm(input: SimplexInput): {
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
  
  // Coeficientes de la función objetivo
  for (let i = 0; i < numVariables; i++) {
    c.push(problemType === 'max' ? objectiveCoefficients[i] : -objectiveCoefficients[i]);
  }
  
  // Variables de holgura tienen coeficiente 0 en función objetivo
  for (let i = 0; i < numSlackVars; i++) {
    c.push(0);
  }
  
  // Variables artificiales tienen coeficiente -M (gran penalización)
  for (let i = 0; i < numArtificialVars; i++) {
    c.push(-1000000);
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

function calculateBinvByProduct(B: Matrix): { Binv: Matrix; elementaryMatrices: Matrix[] } {
  const n = B.rows;
  const elementaryMatrices: Matrix[] = [];
  let currentB = copyMatrix(B);
  
  // Aplicar eliminación gaussiana y guardar matrices elementales
  for (let col = 0; col < n; col++) {
    // Encontrar pivote
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(currentB.data[row][col]) > Math.abs(currentB.data[pivotRow][col])) {
        pivotRow = row;
      }
    }
    
    if (Math.abs(currentB.data[pivotRow][col]) < 1e-10) {
      throw new Error('La matriz base es singular');
    }
    
    // Intercambiar filas si es necesario
    if (pivotRow !== col) {
      [currentB.data[col], currentB.data[pivotRow]] = [currentB.data[pivotRow], currentB.data[col]];
    }
    
    const pivotValue = currentB.data[col][col];
    const column = currentB.data.map(row => row[col]);
    
    const E = createElementaryMatrix(n, col, col, pivotValue, column);
    elementaryMatrices.push(E);
    
    // Aplicar matriz elemental
    currentB = multiplyMatrices(E, currentB);
  }
  
  // Calcular B^-1 multiplicando todas las matrices elementales
  let Binv = getIdentityMatrix(n);
  for (const E of elementaryMatrices) {
    Binv = multiplyMatrices(E, Binv);
  }
  
  return { Binv, elementaryMatrices };
}

export function solveSimplex(input: SimplexInput): SimplexResult {
  try {
    const { A, b, c, numSlackVars, numArtificialVars } = convertToStandardForm(input);
    const iterations: IterationData[] = [];
    const maxIterations = 100;
    
    // Encontrar base inicial
    const initialBasicVariables = findInitialBasis(A, input.numVariables, numSlackVars, numArtificialVars);
    const basicVariables = [...initialBasicVariables];
    let nonBasicVariables = Array.from({ length: A.cols }, (_, i) => i).filter(i => !basicVariables.includes(i));
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Extraer matriz base B
      const B = extractColumns(A, basicVariables);
      
      // Calcular determinante
      const detB = calculateDeterminant(B);
      
      if (Math.abs(detB) < 1e-10) {
        return {
          success: false,
          message: 'Error: La matriz base es singular (determinante = 0)',
          iterations
        };
      }
      
      // Calcular B^-1 por forma de producto de la inversa
      const { Binv, elementaryMatrices } = calculateBinvByProduct(B);
      
      // Calcular CB (coeficientes de variables básicas)
      const CB = basicVariables.map(i => c[i]);
      
      // Calcular XB = B^-1 * b
      const XB = multiplyMatrixVector(Binv, b);
      
      // Verificar factibilidad
      if (XB.some(x => x < -1e-6)) {
        return {
          success: false,
          message: 'Error: Solución no factible encontrada',
          iterations
        };
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
      
      for (let j = 0; j < nonBasicVariables.length; j++) {
        const varIndex = nonBasicVariables[j];
        if (ZjCj[varIndex] < minZjCj - 1e-6) {
          minZjCj = ZjCj[varIndex];
          enteringVariable = varIndex;
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
        elementaryMatrices
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
      
      if (leavingVariable === null) {
        return {
          success: false,
          message: 'Error: Solución no acotada',
          iterations
        };
      }
      
      // Actualizar variable de salida en la última iteración
      iterations[iterations.length - 1].leavingVariable = leavingVariable;
      
      // Actualizar base
      basicVariables[leavingIndex] = enteringVariable;
      nonBasicVariables = Array.from({ length: A.cols }, (_, i) => i).filter(i => !basicVariables.includes(i));
    }
    
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