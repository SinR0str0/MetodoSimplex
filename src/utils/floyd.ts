export interface Edge {
  from: string;
  to: string;
  cost: number;
}

export interface FloydStep {
  k: number;
  columna: number[];
  fila: number[];       
  D: number[][];      // Matriz de costos
  Z: (number | null)[][]; // Matriz de predecesores
  cambios: { i: number; j: number; nuevoCosto: number; nuevoPredecesor: number | null }[]; // Cambios realizados en esta iteración
  tieneCicloNegativo: boolean;    
  verticesCicloNegativo: number[];
}

export function runFloydWarshallSteps(n: number, edges: Edge[]): FloydStep[] {
  const labels = Array.from({ length: n }, (_, i) => `${i + 1}`);
  const labelToIdx = new Map(labels.map((l, i) => [l, i]));

  // 1. Inicializar matrices
  const D: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
  const Z: (number | null)[][] = Array(n)
  .fill(null)
  .map((_, i) => Array(n).fill(i + 1));

  for (let i = 0; i < n; i++) {
    D[i][i] = 0;
  }

  for (const { from, to, cost } of edges) {
    const i = labelToIdx.get(from)!;
    const j = labelToIdx.get(to)!;
    if (cost < D[i][j]) {
      D[i][j] = cost;
    }
  }
  const cicloV0 = D.some((row, i) => row[i] < 0) ? D.map((row, i) => row[i] < 0 ? i + 1 : 0).filter(Boolean) : [];
  const steps: FloydStep[] = [];
  // Estado inicial (k=0)
  steps.push({ 
    k: 0, D: D.map(r => [...r]), 
    Z: Z.map(r => [...r]), 
    columna: [0], 
    fila: [0], 
    cambios: [],
    tieneCicloNegativo: cicloV0.length > 0,
    verticesCicloNegativo: cicloV0
  });

  // 2. Iteraciones
  for (let k = 0; k < n; k++) {
    let col: number[] = [];
    let fil: number[] = [];
    let cam: { i: number; j: number; nuevoCosto: number; nuevoPredecesor: number | null }[] = [];

    for (let i = 0; i < n; i++) {
        if (i!== k && D[i][k] !== Infinity) {
            fil.push(i+1);
        }
        if (i!== k && D[k][i] !== Infinity) {
            col.push(i+1);
        }
    }

    for (let i = 0; i < fil.length; i++) {
        const f = fil[i]-1;
        for (let j = 0; j < col.length; j++) {
            const c = col[j]-1;
            if (D[f][k] + D[k][c] < D[f][c]) {
                D[f][c] = D[f][k] + D[k][c];
                Z[f][c] = Z[k][c];
                cam.push({ i: f+1, j: c+1, nuevoCosto: D[f][c], nuevoPredecesor: Z[f][c] });
            }
        }
    }

    const cicloV = D.map((row, i) => row[i] < 0 ? i + 1 : 0).filter(v => v !== 0);

    // Guardar estado después de procesar el vértice k+1
    steps.push({ 
        k: k + 1, 
        D: D.map(r => [...r]), 
        Z: Z.map(r => [...r]), 
        columna: col, 
        fila: fil, 
        cambios: cam,
        tieneCicloNegativo: cicloV.length > 0,
        verticesCicloNegativo: cicloV 
    });
    if (cicloV.length > 0) {
        return steps; // Si se detecta un ciclo negativo, se detiene el proceso
    }
  }

  return steps;
}