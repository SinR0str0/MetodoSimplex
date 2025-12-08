// Operaciones matriciales para el método simplex revisado

export interface Matrix {
  rows: number;
  cols: number;
  data: number[][];
}

export function createMatrix(rows: number, cols: number, initialValue: number = 0): Matrix {
  return {
    rows,
    cols,
    data: Array(rows).fill(0).map(() => Array(cols).fill(initialValue))
  };
}

export function multiplyMatrices(A: Matrix, B: Matrix): Matrix {
  if (A.cols !== B.rows) {
    throw new Error('Las dimensiones de las matrices no son compatibles para multiplicación');
  }

  const result = createMatrix(A.rows, B.cols);

  for (let i = 0; i < A.rows; i++) {
    for (let j = 0; j < B.cols; j++) {
      let sum = 0;
      for (let k = 0; k < A.cols; k++) {
        sum += A.data[i][k] * B.data[k][j];
      }
      result.data[i][j] = sum;
    }
  }

  return result;
}

export function multiplyMatrixVector(A: Matrix, v: number[]): number[] {
  if (A.cols !== v.length) {
    throw new Error('Las dimensiones no son compatibles');
  }

  const result: number[] = [];

  for (let i = 0; i < A.rows; i++) {
    let sum = 0;
    for (let j = 0; j < A.cols; j++) {
      sum += A.data[i][j] * v[j];
    }
    result.push(sum);
  }

  return result;
}

export function calculateDeterminant(matrix: Matrix): number {
  if (matrix.rows !== matrix.cols) {
    throw new Error('La matriz debe ser cuadrada para calcular el determinante');
  }

  const n = matrix.rows;

  // Casos base
  if (n === 1) {
    return matrix.data[0][0];
  }

  if (n === 2) {
    return (
      matrix.data[0][0] * matrix.data[1][1] -
      matrix.data[0][1] * matrix.data[1][0]
    );
  }

  // Función auxiliar para obtener la submatriz (minor)
  const subMatrix = (mat: number[][], rowToRemove: number, colToRemove: number): number[][] => {
    return mat
      .filter((_, rowIndex) => rowIndex !== rowToRemove)
      .map(row => row.filter((_, colIndex) => colIndex !== colToRemove));
  };

  // Expansión por cofactores en primera fila
  let det = 0;

  for (let col = 0; col < n; col++) {
    const sign = (col % 2 === 0) ? 1 : -1;

    // Obtener la matriz menor como number[][]
    const minorData = subMatrix(matrix.data, 0, col);

    // Convertir minorData a un objeto Matrix
    const minorMatrix: Matrix = {
      rows: n - 1,
      cols: n - 1,
      data: minorData
    };

    det += sign * matrix.data[0][col] * calculateDeterminant(minorMatrix);
  }

  return det;
}


export function getIdentityMatrix(n: number): Matrix {
  const identity = createMatrix(n, n);
  for (let i = 0; i < n; i++) {
    identity.data[i][i] = 1;
  }
  return identity;
}

export function createElementaryMatrix(n: number, pivotRow: number, pivotCol: number, pivotValue: number, column: number[]): Matrix {
  const E = getIdentityMatrix(n);

  for (let i = 0; i < n; i++) {
    if (i !== pivotRow) {
      E.data[i][pivotCol] = -column[i] / pivotValue;
    } else {
      E.data[i][pivotCol] = 1 / pivotValue;
    }
  }

  return E;
}

export function extractColumns(A: Matrix, columnIndices: number[]): Matrix {
  const result = createMatrix(A.rows, columnIndices.length);

  for (let j = 0; j < columnIndices.length; j++) {
    const colIndex = columnIndices[j];
    for (let i = 0; i < A.rows; i++) {
      result.data[i][j] = A.data[i][colIndex];
    }
  }

  return result;
}

export function copyMatrix(matrix: Matrix): Matrix {
  return {
    rows: matrix.rows,
    cols: matrix.cols,
    data: matrix.data.map(row => [...row])
  };
}

export function matrixToString(matrix: Matrix, decimals: number = 4): string {
  return matrix.data
    .map(row => row.map(val => val.toFixed(decimals)).join('\t'))
    .join('\n');
}