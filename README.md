# Método Simplex Revisado - Documentación

## 📋 Resumen

Este programa es una aplicación web desarrollada en React con TypeScript que implementa el **Método Simplex Revisado** para resolver problemas de optimización lineal. La aplicación permite a los usuarios ingresar problemas de programación lineal (maximización o minimización) y obtener la solución óptima junto con todas las iteraciones del algoritmo, mostrando las matrices base, sus inversas, y los cálculos intermedios.

**Autor:** Hernández Peña Angel Adrian

## 🎯 ¿Qué hace el programa?

El programa resuelve problemas de optimización lineal mediante el algoritmo del Método Simplex Revisado, que es una versión eficiente del método simplex tradicional que trabaja directamente con matrices en lugar de tablas completas. El programa:

1. **Recibe datos del problema**: Número de variables, número de restricciones, tipo de problema (maximización/minimización), coeficientes de la función objetivo y restricciones.
2. **Convierte a forma estándar**: Transforma el problema agregando variables de holgura y artificiales según sea necesario.
3. **Ejecuta el algoritmo**: Realiza iteraciones del método simplex revisado hasta encontrar la solución óptima o detectar que el problema no tiene solución.
4. **Muestra resultados**: Presenta la solución óptima, el valor de la función objetivo y todas las iteraciones con sus matrices y cálculos.

## 📦 Requisitos del Sistema

### Requisitos de Software

- **Node.js**: Versión 18 o superior
- **pnpm**: Versión 8.10.0 (gestor de paquetes)
- **Navegador web moderno**: Chrome, Firefox, Edge, Safari (versiones recientes)

### Dependencias Principales

El proyecto utiliza las siguientes tecnologías y librerías:

- **React 19.1.1**: Framework de UI
- **TypeScript 5.5.3**: Lenguaje de programación
- **Vite 5.4.1**: Herramienta de construcción
- **Tailwind CSS 3.4.11**: Framework de estilos
- **React Router DOM 6.26.2**: Enrutamiento
- **Radix UI**: Componentes de UI accesibles
- **Lucide React**: Iconos

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Ejecutar en modo desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

### 3. Compilar para producción

```bash
pnpm build
```

### 4. Previsualizar build de producción

```bash
pnpm preview
```

## 🏗️ Estructura del Proyecto

```
Simplex/
├── src/
│   ├── main.tsx              # Punto de entrada de la aplicación
│   ├── App.tsx               # Componente principal con enrutamiento
│   ├── pages/
│   │   ├── Index.tsx         # Página principal con el flujo de la aplicación
│   │   └── NotFound.tsx      # Página 404
│   ├── components/
│   │   ├── InputForm.tsx     # Formulario inicial de parámetros
│   │   ├── SimplexTable.tsx  # Tabla para ingresar coeficientes
│   │   ├── ResultDisplay.tsx # Muestra los resultados finales
│   │   ├── IterationDisplay.tsx # Muestra cada iteración del algoritmo
│   │   └── ui/               # Componentes de UI reutilizables
│   ├── utils/
│   │   ├── simplexSolver.ts  # Lógica principal del algoritmo simplex
│   │   └── matrixOperations.ts # Operaciones con matrices
│   ├── hooks/                # Hooks personalizados
│   └── lib/                  # Utilidades generales
├── package.json
└── vite.config.ts
```

## ⚙️ Cómo Funciona el Programa

### Flujo de la Aplicación

1. **Paso 1 - Entrada de Parámetros** (`InputForm.tsx`):
   - El usuario ingresa el número de variables (1-10)
   - El usuario ingresa el número de restricciones (1-10)
   - El usuario selecciona el tipo de problema (Maximización o Minimización)

2. **Paso 2 - Entrada de Datos** (`SimplexTable.tsx`):
   - El usuario ingresa los coeficientes de la función objetivo
   - El usuario ingresa los coeficientes de cada restricción
   - El usuario selecciona el tipo de cada restricción (≤, ≥, =)
   - El usuario ingresa el lado derecho (RHS) de cada restricción

3. **Paso 3 - Resolución** (`simplexSolver.ts`):
   - El algoritmo convierte el problema a forma estándar
   - Ejecuta iteraciones del método simplex revisado
   - Calcula matrices base, inversas, y valores Zj-Cj
   - Determina variables de entrada y salida

4. **Paso 4 - Visualización de Resultados**:
   - `ResultDisplay.tsx`: Muestra la solución óptima y el valor de Z
   - `IterationDisplay.tsx`: Muestra cada iteración con todas sus matrices y cálculos

## 🔧 Funciones Principales

### Archivo: `simplexSolver.ts`

#### `solveSimplex(input: SimplexInput): SimplexResult`
**Descripción**: Función principal que ejecuta el algoritmo del método simplex revisado.

**Parámetros**:
- `input`: Objeto con los datos del problema (variables, restricciones, coeficientes, etc.)

**Retorna**: Objeto `SimplexResult` con:
- `success`: Boolean indicando si se encontró solución
- `message`: Mensaje descriptivo del resultado
- `iterations`: Array con los datos de cada iteración
- `optimalSolution`: Array con los valores óptimos de las variables (si existe)
- `optimalValue`: Valor óptimo de la función objetivo (si existe)

**Proceso**:
1. Convierte el problema a forma estándar
2. Encuentra una base inicial
3. Itera hasta encontrar solución óptima o detectar error:
   - Calcula la matriz base B y su inversa B⁻¹
   - Calcula XB = B⁻¹ * b
   - Calcula Z = CB * XB
   - Calcula Zj - Cj para todas las variables
   - Determina variable de entrada (más negativa Zj-Cj)
   - Determina variable de salida (razón mínima)
   - Actualiza la base usando matrices elementales

#### `convertToStandardForm(input: SimplexInput, phase: 'I'|'II'): {...}`
**Descripción**: Convierte el problema a forma estándar agregando variables de holgura y artificiales.

**Parámetros**:
- `input`: Datos del problema original
- `phase`: Fase del algoritmo (I para fase auxiliar, II para fase principal)

**Retorna**: Objeto con:
- `A`: Matriz de coeficientes ampliada
- `b`: Vector de términos independientes
- `c`: Vector de coeficientes de la función objetivo
- `numSlackVars`: Número de variables de holgura
- `numArtificialVars`: Número de variables artificiales

**Lógica**:
- Restricciones `≤`: Agrega variable de holgura con coeficiente +1
- Restricciones `≥`: Agrega variable de holgura con coeficiente -1 y variable artificial con +1
- Restricciones `=`: Agrega variable artificial con coeficiente +1

#### `findInitialBasis(A: Matrix, numVariables: number, numSlackVars: number, numArtificialVars: number): number[]`
**Descripción**: Encuentra una base inicial usando variables de holgura y artificiales.

**Retorna**: Array con los índices de las variables básicas iniciales.

### Archivo: `matrixOperations.ts`

#### `createMatrix(rows: number, cols: number, initialValue?: number): Matrix`
**Descripción**: Crea una nueva matriz con las dimensiones especificadas.

**Parámetros**:
- `rows`: Número de filas
- `cols`: Número de columnas
- `initialValue`: Valor inicial para todas las celdas (default: 0)

**Retorna**: Objeto `Matrix` con estructura `{rows, cols, data: number[][]}`

#### `multiplyMatrices(A: Matrix, B: Matrix): Matrix`
**Descripción**: Multiplica dos matrices A y B.

**Validación**: Verifica que A.cols === B.rows

**Retorna**: Matriz resultado de dimensiones A.rows × B.cols

#### `multiplyMatrixVector(A: Matrix, v: number[]): number[]`
**Descripción**: Multiplica una matriz por un vector.

**Validación**: Verifica que A.cols === v.length

**Retorna**: Vector resultado de longitud A.rows

#### `calculateDeterminant(matrix: Matrix): number`
**Descripción**: Calcula el determinante de una matriz cuadrada usando expansión por cofactores.

**Validación**: Verifica que la matriz sea cuadrada

**Algoritmo**: 
- Casos base para matrices 1×1 y 2×2
- Para matrices mayores: expansión por cofactores en la primera fila

#### `getIdentityMatrix(n: number): Matrix`
**Descripción**: Crea una matriz identidad de tamaño n×n.

**Retorna**: Matriz con 1s en la diagonal y 0s en el resto

#### `createElementaryMatrix(n: number, pivotRow: number, pivotCol: number, pivotValue: number, column: number[]): Matrix`
**Descripción**: Crea una matriz elemental para actualizar B⁻¹ en el método simplex revisado.

**Parámetros**:
- `n`: Tamaño de la matriz
- `pivotRow`: Fila del pivote
- `pivotCol`: Columna del pivote
- `pivotValue`: Valor del pivote
- `column`: Columna de entrada

**Retorna**: Matriz elemental E tal que E * B⁻¹ = nueva B⁻¹

#### `extractColumns(A: Matrix, columnIndices: number[]): Matrix`
**Descripción**: Extrae columnas específicas de una matriz.

**Parámetros**:
- `A`: Matriz original
- `columnIndices`: Array con los índices de las columnas a extraer

**Retorna**: Nueva matriz con solo las columnas especificadas

#### `copyMatrix(matrix: Matrix): Matrix`
**Descripción**: Crea una copia profunda de una matriz.

**Retorna**: Nueva matriz con los mismos datos pero independiente en memoria

### Archivo: `Index.tsx`

#### `handleInputSubmit(vars: number, constraints: number, type: ProblemType)`
**Descripción**: Maneja el envío del formulario inicial y avanza al paso de entrada de datos.

#### `handleSolve(input: SimplexInput)`
**Descripción**: Ejecuta el algoritmo simplex y muestra los resultados.

#### `handleReset()`
**Descripción**: Reinicia la aplicación al estado inicial.

#### `handleBackToTable()`
**Descripción**: Regresa a la vista de tabla para modificar datos.

### Archivo: `InputForm.tsx`

#### `handleSubmit(e: React.FormEvent)`
**Descripción**: Valida y procesa el formulario de parámetros iniciales.

**Validaciones**:
- Número de variables entre 1 y 10
- Número de restricciones entre 1 y 10

### Archivo: `SimplexTable.tsx`

#### `handleSolve()`
**Descripción**: Valida y procesa los datos ingresados, luego llama a `onSolve`.

**Validaciones**:
- Todos los valores deben ser numéricos
- Todos los RHS deben ser no negativos

#### `handleObjectiveChange(index: number, value: string)`
**Descripción**: Actualiza un coeficiente de la función objetivo.

#### `handleConstraintCoefficientChange(constraintIndex: number, varIndex: number, value: string)`
**Descripción**: Actualiza un coeficiente de una restricción.

#### `handleConstraintTypeChange(constraintIndex: number, type: ConstraintType)`
**Descripción**: Cambia el tipo de una restricción (≤, ≥, =).

#### `handleRhsChange(constraintIndex: number, value: string)`
**Descripción**: Actualiza el lado derecho (RHS) de una restricción.

### Archivo: `ResultDisplay.tsx`

#### `formatNumber(num: number): string`
**Descripción**: Formatea un número a 4 decimales, mostrando 0.0000 si es muy pequeño.

**Retorna**: String formateado

### Archivo: `IterationDisplay.tsx`

#### `formatNumber(num: number): string`
**Descripción**: Formatea un número a 4 decimales para visualización.

## 📊 Tipos de Datos

### `SimplexInput`
```typescript
{
  numVariables: number;
  numConstraints: number;
  problemType: 'max' | 'min';
  objectiveCoefficients: number[];
  constraints: {
    coefficients: number[];
    type: '<=' | '>=' | '=';
    rhs: number;
  }[];
}
```

### `IterationData`
```typescript
{
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
```

### `Matrix`
```typescript
{
  rows: number;
  cols: number;
  data: number[][];
}
```

## 🎨 Características de la Interfaz

- **Diseño moderno**: Interfaz con gradientes y diseño responsivo
- **Visualización detallada**: Muestra todas las matrices y cálculos de cada iteración
- **Navegación intuitiva**: Flujo paso a paso con botones de navegación
- **Validación de entrada**: Verifica que los datos ingresados sean válidos
- **Mensajes de error**: Informa claramente cuando hay problemas (no acotado, no factible, etc.)

## ⚠️ Limitaciones

- Máximo 10 variables
- Máximo 10 restricciones
- No implementa Fase I del método de dos fases (solo maneja problemas con base inicial factible)
- Máximo 100 iteraciones para evitar bucles infinitos

## 🔍 Manejo de Errores

El programa detecta y reporta los siguientes errores:

1. **Matriz base singular**: Cuando el determinante de B es 0
2. **Solución no factible**: Cuando XB tiene valores negativos
3. **Solución no acotada**: Cuando no se puede encontrar variable de salida
4. **Máximo de iteraciones**: Cuando se alcanzan 100 iteraciones sin convergencia
5. **RHS negativos**: Validación previa que requiere RHS ≥ 0

## 📝 Notas Técnicas

- El algoritmo utiliza el **Método Simplex Revisado**, que es más eficiente que el método simplex tabular tradicional
- Se actualiza B⁻¹ usando matrices elementales en lugar de recalcularla desde cero
- Los cálculos numéricos usan una tolerancia de 1e-10 para comparaciones de punto flotante
- La aplicación está construida con Vite para desarrollo rápido y builds optimizados

## 🛠️ Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Compila la aplicación para producción
- `pnpm preview`: Previsualiza el build de producción
- `pnpm lint`: Ejecuta el linter para verificar el código

## 📚 Referencias

El algoritmo implementado sigue los principios del Método Simplex Revisado descritos en textos de programación lineal y optimización.

---

**Desarrollado con ❤️ usando React, TypeScript y Vite**
