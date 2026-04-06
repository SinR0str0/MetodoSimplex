# Método Simplex y Floyd - Herramientas de Optimización

## Descripción

Este proyecto es una aplicación web interactiva creada con **React**, **TypeScript**, **Vite** y **Tailwind CSS**. Permite resolver dos tipos de problemas de optimización:

- **Método Simplex Revisado**: resolución de programación lineal con visualización de iteraciones.
- **Algoritmo de Floyd**: cálculo de distancias mínimas entre todos los pares de vértices en un grafo dirigido.

La aplicación está diseñada para ser clara, accesible y didáctica, mostrando tanto los datos de entrada como los resultados y pasos intermedios.

## ¿Qué hace cada programa?

### Método Simplex Revisado
Este algoritmo resuelve problemas de **programación lineal** (maximización o minimización) de manera eficiente. El método simplex revisado es una variante optimizada que utiliza matrices en lugar de tablas completas, lo que lo hace más eficiente para problemas de mayor escala.

**Funcionalidades:**
- Ingreso de variables (hasta 10) y restricciones (hasta 10).
- Soporte para restricciones de tipo ≤, ≥ y =.
- Visualización paso a paso de cada iteración del algoritmo.
- Muestra matrices base, inversas y cálculos intermedios.
- Detección de soluciones óptimas, ilimitadas o infactibles.

### Algoritmo de Floyd (Floyd-Warshall)
Este algoritmo calcula las **distancias mínimas entre todos los pares de vértices** en un grafo dirigido ponderado. Es útil para encontrar rutas óptimas en redes de transporte, telecomunicaciones y otros sistemas.

**Funcionalidades:**
- Construcción visual de grafos dirigidos con hasta 10 vértices.
- Ingreso de aristas con costos (positivos o negativos).
- Visualización del grafo en canvas con flechas y etiquetas.
- Seguimiento de iteraciones mostrando cambios en las matrices de costos (D) y predecesores (Z).
- Detección de ciclos negativos que indican inconsistencias en el grafo.

## Requisitos del sistema

### Hardware
- Procesador moderno (recomendado: Intel i5 o equivalente).
- Memoria RAM: mínimo 4 GB, recomendado 8 GB.
- Espacio en disco: 500 MB libres.

### Software
- **Sistema operativo**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+).
- **Navegador web**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.
- **Node.js**: Versión 18.0.0 o superior.
- **Gestor de paquetes**: pnpm versión 8.10.0 o superior.

### Dependencias
El proyecto incluye todas las dependencias necesarias en `package.json`. Se instalarán automáticamente con `pnpm install`.

## Instalación

### Pasos

```bash
pnpm install
pnpm dev
```

Después de ejecutar `pnpm dev`, la aplicación estará disponible en `http://localhost:5173`.

## Scripts disponibles

- `pnpm dev`: ejecuta el servidor de desarrollo.
- `pnpm build`: compila el proyecto para producción.
- `pnpm preview`: previsualiza la versión de producción.
- `pnpm lint`: ejecuta ESLint sobre el código fuente.

## Estructura del proyecto

```
MetodoSimplex/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── SimplexPage.tsx
│   │   ├── FloydPage.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── InputForm.tsx
│   │   ├── SimplexTable.tsx
│   │   ├── ResultDisplay.tsx
│   │   ├── IterationDisplay.tsx
│   │   └── ui/
│   ├── utils/
│   │   ├── simplexSolver.ts
│   │   ├── floyd.ts
│   │   └── matrixOperations.ts
│   ├── hooks/
│   └── lib/
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Rutas disponibles

- `/`: página de bienvenida con acceso a las herramientas.
- `/simplex`: implementación del Método Simplex Revisado.
- `/floyd`: implementación del Algoritmo de Floyd.

## Tecnologías utilizadas

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Radix UI
- Lucide React
- @tanstack/react-query

## Uso rápido

1. Accede a la página principal.
2. Elige la herramienta que quieres usar.
3. Ingresa los datos del problema o del grafo.
4. Ejecuta el algoritmo y revisa los resultados.

## 📚 Referencias

El algoritmo implementado sigue los principios del Método Simplex Revisado descritos en textos de programación lineal y optimización. Para más información sobre algoritmos de optimización.

## Sitio web personal

Visita mi sitio web personal: [https://sinr0str0.github.io/](https://sinr0str0.github.io/)

## Autor

Hernández Peña Angel Adrian

## Licencia

Este proyecto puede ser usado como referencia para aprendizaje y estudio de algoritmos de optimización.
