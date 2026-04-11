'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { runFloydWarshallSteps, reconstructPath, findTerminalNodesFromMatrix, findAislatedNodesFromMatrix, type FloydStep } from '@/utils/floyd';
import { usePageMeta } from '@/hooks/usePageMeta';

interface Relation {
  from: string;
  to: string;
  cost: number;
}

export default function FloydPage() {
  const [vertices, setVertices] = useState<number>(0);
  const [edges, setEdges] = useState<number>(0);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [fromVertex, setFromVertex] = useState<string>('');
  const [toVertex, setToVertex] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [costInput, setCostInput] = useState<string>('');
  const [steps, setSteps] = useState<FloydStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const fromVertexRef = useRef<HTMLSelectElement>(null);
  const [pathFrom, setPathFrom] = useState<string>('');
  const [pathTo, setPathTo] = useState<string>('');
  const [pathResult, setPathResult] = useState<{ 
    path: string; 
    totalCost: number | null; 
    error: string | null; 
  } | null>(null);
  const [initialNodes, setInitialNodes] = useState<number[]>([]);
  const [finalNodes, setFinalNodes] = useState<number[]>([]);
  const [isolatedNodes, setIsolatedNodes] = useState<number[]>([]);


  const isValidInput = (value: number): boolean => {
    return Number.isInteger(value) && value > 0 && value < 11;
  };

  const getVertexLabels = useCallback((): string[] => {
    if (vertices === 0) return [];
    return Array.from({ length: vertices }, (_, i) => `${i + 1}`);
  }, [vertices]);

  const getNodePosition = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    nodeRadius: number
  ) => {
    const headLen = 12;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const angle = Math.atan2(dy, dx);

    const endX = toX - (dx / dist) * nodeRadius;
    const endY = toY - (dy / dist) * nodeRadius;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle - Math.PI / 6),
      endY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLen * Math.cos(angle + Math.PI / 6),
      endY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#374151';
    ctx.fill();
  };

  // Dibujar bucle (self-loop)
  const drawLoop = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    nodeRadius: number
  ) => {
    const loopRadius = nodeRadius * .8;

    ctx.beginPath();
    ctx.arc(
      x + nodeRadius,
      y - nodeRadius,
      loopRadius,
      0.3 * Math.PI,
      2.3 * Math.PI
    );
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Renderizar gráfica en canvas
  const renderGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 🔧 Escalar canvas para pantallas de alta densidad
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const labels = getVertexLabels();
    if (labels.length === 0) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ingresa el número de vértices para comenzar', rect.width / 2, rect.height / 2);
      return;
    }

    // Configurar canvas (usar rect.width/height para coordenadas lógicas)
    ctx.clearRect(0, 0, rect.width, rect.height);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    const nodeRadius = 24;

    // Calcular posiciones de nodos
    const positions = new Map<string, { x: number; y: number }>();
    labels.forEach((label, i) => {
      positions.set(label, getNodePosition(i, labels.length, centerX, centerY, radius));
    });

    // Dibujar aristas (relaciones)
    relations.forEach((rel) => {
      const from = positions.get(rel.from);
      const to = positions.get(rel.to);
      if (!from || !to) return;

      if (rel.from === rel.to) {
        drawLoop(ctx, from.x, from.y, nodeRadius);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(rel.cost), from.x + nodeRadius * 1.6, from.y - nodeRadius * 1.4);
      } else {
        drawArrow(ctx, from.x, from.y, to.x, to.y, nodeRadius);
        
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 10, midY - 8, 20, 12);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(rel.cost), midX, midY - 2);
      }
    });

    // Dibujar nodos
    labels.forEach((label) => {
      const pos = positions.get(label);
      if (!pos) return;

      const nodeNum = Number(label);
      let fillColor = '#3b82f6';   // Azul por defecto
      let strokeColor = '#2563eb';
      let lineWidth = 3;

      // 🔹 Asignar color según clasificación
      if (initialNodes.includes(nodeNum)) {
        fillColor = '#10b981'; // 🟢 Verde (solo sale)
        strokeColor = '#059669';
      } else if (finalNodes.includes(nodeNum)) {
        fillColor = '#ef4444'; // 🔴 Rojo (solo llega)
        strokeColor = '#b91c1c';
      } else if (isolatedNodes.includes(nodeNum)) {
        fillColor = '#9ca3af'; // ⚪ Gris (sin conexiones)
        strokeColor = '#4b5563';
        lineWidth = 2;
      }

      // Dibujar círculo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Dibujar etiqueta
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y);
    });
  }, [vertices, relations, getVertexLabels, initialNodes, finalNodes, isolatedNodes]);

  // Re-renderizar cuando cambien las relaciones o vértices
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // Manejar cambio de número de vértices
  const handleVerticesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setVertices(value);
    
    if (!isValidInput(value)) {
      setErrors(prev => ({ ...prev, vertices: 'Ingresa un número entre 1 y 10' }));
    } else {
      setErrors(prev => {
        const { vertices, ...rest } = prev;
        return rest;
      });
      // Resetear relaciones si cambiamos el número de vértices
      setRelations([]);
    }
  };

  // Manejar cambio de número de líneas
  const handleEdgesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setEdges(value);
    
    if (value < 0) {
      setErrors(prev => ({ ...prev, edges: 'El número debe ser positivo' }));
    } else {
      setErrors(prev => {
        const { edges, ...rest } = prev;
        return rest;
      });
    }
  };

  // Guardar relación
  const handleSaveRelation = () => {
    const labels = getVertexLabels();
    
    if (!fromVertex.trim() || !toVertex.trim()) {
      setErrors(prev => ({ ...prev, relation: 'Completa ambos campos' }));
      return;
    }
    
    if (!labels.includes(fromVertex) || !labels.includes(toVertex)) {
      setErrors(prev => ({ ...prev, relation: 'Vértice no válido' }));
      return;
    }
    
    const parsedCost = parseFloat(costInput);
    if (isNaN(parsedCost)) {
      setErrors(prev => ({ ...prev, relation: 'Ingresa un costo numérico válido' }));
      return;
    }

    // Agregar relación y actualizar vista
    setRelations(prev => [...prev, { from: fromVertex, to: toVertex, cost: parsedCost }]);
    setFromVertex('');
    setToVertex('');
    setCostInput('');
    setErrors(prev => {
      const { relation, ...rest } = prev;
      return rest;
    });
    
    setTimeout(() => {
      fromVertexRef.current?.focus();
    }, 50);
  };

  // Eliminar relación
  const handleRemoveRelation = (index: number) => {
    setRelations(prev => prev.filter((_, i) => i !== index));
  };

  // Validar formulario completo
  const canCalculate = () => {
    if (!isValidInput(vertices)) return false;
    if (edges < 0) return false;
    if (relations.length !== edges) return false;
    return Object.keys(errors).length === 0;
  };

  // Manejar cálculo
const handleCalculate = () => {
  if (!canCalculate()) return;
  
  const allSteps = runFloydWarshallSteps(vertices, relations);
  setSteps(allSteps);
  setCurrentStepIdx(0);
  setShowResults(true);


  const { initial, final, isolated } = findTerminalNodesFromMatrix(allSteps[0].D);
  setInitialNodes(initial);
  setFinalNodes(final);
  setIsolatedNodes(isolated);
  
  renderGraph();
};

  const handleClearAll = () => {
    if (relations.length > 0 || showResults) {
      if (!confirm('¿Estás seguro de borrar todos los datos?')) return;
    }
    setVertices(0);
    setEdges(0);
    setRelations([]);
    setFromVertex('');
    setToVertex('');
    setCostInput('');
    setErrors({});
    setSteps([]);
    setCurrentStepIdx(0);
    setShowResults(false);
    setInitialNodes([]);
    setFinalNodes([]);
    setIsolatedNodes([]);
    
    // 🔹 Limpia los nuevos estados de ruta
    setPathFrom('');
    setPathTo('');
    setPathResult(null);
    
    // Limpiar canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFindPath = () => {
    if (!showResults || steps.length === 0) return;
    
    const labels = getVertexLabels();
    const fromIdx = labels.indexOf(pathFrom);
    const toIdx = labels.indexOf(pathTo);
    
    // Validaciones básicas
    if (fromIdx === -1 || toIdx === -1) {
      setPathResult({ path: '', totalCost: null, error: 'Selecciona vértices válidos' });
      return;
    }
    
    if (fromIdx === toIdx) {
      setPathResult({ 
        path: `${pathFrom} -> ${pathTo}`, 
        totalCost: 0, 
        error: null 
      });
      return;
    }
    
    // Obtener matrices del paso actual (o el final si prefieres)
    const currentStep = steps[steps.length - 1]; // O steps[steps.length - 1] para el resultado final
    const { D, Z } = currentStep;
    
    // Verificar si existe camino
    if (D[fromIdx][toIdx] === Infinity) {
      setPathResult({ path: '', totalCost: null, error: 'No existe camino entre estos vértices' });
      return;
    }
    
    // Reconstruir ruta
    const pathIndices = reconstructPath(Z, fromIdx, toIdx);
    
    if (!pathIndices) {
      setPathResult({ path: '', totalCost: null, error: 'No se pudo reconstruir la ruta' });
      return;
    }
    
    // Formatear salida
    const pathLabels = pathIndices.map(i => labels[i]);
    const pathString = pathLabels.join(' -> ');
    const totalCost = D[fromIdx][toIdx];
    
    setPathResult({
      path: pathString,
      totalCost: totalCost,
      error: null
    });
  };

  const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evita submit del form
      handleSaveRelation();
    }
  };

  const stepCount = steps.length - 1;
  const handlePrevStep = () => setCurrentStepIdx((current) => Math.max(0, current - 1));
  const handleNextStep = () => setCurrentStepIdx((current) => Math.min(stepCount, current + 1));

  usePageMeta('Algoritmo de Floyd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Floyd-Warshall</p>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Algoritmo de Floyd
          </h1>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            Construye un grafo dirigido con costos y observa paso a paso cómo el algoritmo encuentra las rutas más cortas entre todos los pares de vértices.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Configura tu grafo</CardTitle>
            <CardDescription>
              Ingresa el número de vértices, el número de aristas y agrega cada relación dirigida con su costo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número de vértices (n)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={vertices || ''}
                  onChange={handleVerticesChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="1-10"
                />
                {errors.vertices && <p className="mt-2 text-sm text-red-600">{errors.vertices}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número de aristas (e)</label>
                <input
                  type="number"
                  min="0"
                  value={edges || ''}
                  onChange={handleEdgesChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0 o más"
                />
                {errors.edges && <p className="mt-2 text-sm text-red-600">{errors.edges}</p>}
              </div>
            </div>

            {vertices > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="grid gap-4 sm:grid-cols-3 flex-1">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Desde</label>
                      <select
                        ref={fromVertexRef}
                        value={fromVertex}
                        onChange={(e) => setFromVertex(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Seleccionar</option>
                        {getVertexLabels().map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Hacia</label>
                      <select
                        value={toVertex}
                        onChange={(e) => setToVertex(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="">Seleccionar</option>
                        {getVertexLabels().map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Costo</label>
                      <input
                        type="number"
                        step="any"
                        value={costInput}
                        onChange={(e) => setCostInput(e.target.value)}
                        onKeyDown={handleCostKeyDown}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveRelation} className="min-w-[160px] w-full sm:w-auto">
                    Agregar relación
                  </Button>
                </div>

                {errors.relation && <p className="text-sm text-red-600">{errors.relation}</p>}

                {relations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">Relaciones guardadas</p>
                      <p className="text-sm text-slate-500">{relations.length}/{edges} agregadas</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {relations.map((rel, idx) => (
                        <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                          <div className="text-sm text-slate-700">
                            <span className="font-semibold">{rel.from}</span> → <span className="font-semibold">{rel.to}</span>
                            <span className="ml-2 text-slate-500">Costo: {rel.cost}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRelation(idx)}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Vista de la gráfica</CardTitle>
            <CardDescription>
              Revisa la representación visual de los nodos y las aristas dirigidas con sus costos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-3xl h-[400px] rounded-3xl border border-slate-200 bg-slate-50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={handleClearAll} className="w-full sm:w-auto">
              Borrar todo
            </Button>
            <Button onClick={handleCalculate} disabled={!canCalculate()} className="w-full sm:w-auto">
              Calcular
            </Button>
          </div>
        </div>

        {showResults && steps.length > 0 && (
          <div className="space-y-6 mt-8">
            <Card>
              <CardHeader className="items-center gap-4 md:flex">
                <div className="space-y-1">
                  <CardTitle>Progreso de iteración</CardTitle>
                  <CardDescription>
                    Revisa el estado actual del algoritmo y los cambios para el paso seleccionado.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevStep} disabled={currentStepIdx === 0}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextStep} disabled={currentStepIdx === stepCount}>
                    Siguiente
                  </Button>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    Paso {currentStepIdx} / {stepCount}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Iteración actual</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">k = {steps[currentStepIdx].k}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Cambios registrados</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{steps[currentStepIdx].cambios.length}</p>
                  </div>
                </div>

                <div>
                  <input
                    type="range"
                    min={0}
                    max={stepCount}
                    value={currentStepIdx}
                    onChange={(e) => setCurrentStepIdx(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </CardContent>
            </Card>

            {steps[currentStepIdx].tieneCicloNegativo && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-red-800">Ciclo Negativo Detectado</h3>
                <p className="mt-1 text-sm text-red-700">
                  El/Los vértices {steps[currentStepIdx].verticesCicloNegativo.join(', ')} tienen camino negativo a sí mismos. 
                  Los costos mínimos no son estables.
                </p>
              </div>
            </div>
          </div>
        )}

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Matriz de costos (D)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border px-3 py-2 text-left font-semibold">V\V</th>
                        {Array.from({ length: vertices }, (_, i) => (
                          <th key={i} className="border px-3 py-2 text-center font-semibold">{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {steps[currentStepIdx].D.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="border px-3 py-2 font-semibold bg-slate-100">{i + 1}</td>
                          {row.map((cell, j) => {
                            const fueModificado = steps[currentStepIdx].cambios?.some(
                              (c) => c.i === i + 1 && c.j === j + 1
                            );
                            return (
                              <td
                                key={j}
                                className={`border px-3 py-2 text-center ${
                                  fueModificado ? 'bg-emerald-100 font-semibold text-emerald-900' : ''
                                }`}
                              >
                                {cell === Infinity ? '∞' : cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle>Matriz de predecesores (Z)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-slate-200 text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border px-3 py-2 text-left font-semibold">V\V</th>
                        {Array.from({ length: vertices }, (_, i) => (
                          <th key={i} className="border px-3 py-2 text-center font-semibold">{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {steps[currentStepIdx].Z.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="border px-3 py-2 font-semibold bg-slate-100">{i + 1}</td>
                          {row.map((cell, j) => {
                            const fueModificado = steps[currentStepIdx].cambios?.some(
                              (c) => c.i === i + 1 && c.j === j + 1
                            );
                            return (
                              <td
                                key={j}
                                className={`border px-3 py-2 text-center ${
                                  fueModificado ? 'bg-emerald-100 font-semibold text-emerald-900' : ''
                                }`}
                              >
                                {cell === null ? '-' : cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            {/* Consulta de ruta específica */}
            {!steps[steps.length - 1].tieneCicloNegativo && (
            <Card className="mt-8 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-900">Consultar ruta específica</CardTitle>
                <CardDescription>
                  Encuentra el camino más corto entre dos vértices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                    <select
                      value={pathFrom}
                      onChange={(e) => setPathFrom(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Seleccionar vértice</option>
                      {getVertexLabels().map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hacia</label>
                    <select
                      value={pathTo}
                      onChange={(e) => setPathTo(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Seleccionar vértice</option>
                      {getVertexLabels().map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  
                  <Button onClick={handleFindPath} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    Encontrar ruta
                  </Button>
                </div>

                {/* 🔹 Alerta de nodos iniciales/finales */}

  {(initialNodes.length > 0 || finalNodes.length > 0 || isolatedNodes.length > 0) && (
  <Card className="mt-4 border-amber-200 bg-amber-50">
    <CardContent className="py-4">
      <div className="space-y-3">
        {initialNodes.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-emerald-600 text-lg">🟢</span>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Nodos iniciales</h4>
              <p className="text-sm text-amber-800 mt-1">
                Vértices: <span className="font-mono font-bold">{initialNodes.join(', ')}</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">No llegan rutas desde otros vértices.</p>
            </div>
          </div>
        )}

        {finalNodes.length > 0 && (
          <div className="flex items-start gap-3 pt-3 border-t border-amber-200">
            <span className="text-red-600 text-lg">🔴</span>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Nodos terminales</h4>
              <p className="text-sm text-amber-800 mt-1">
                Vértices: <span className="font-mono font-bold">{finalNodes.join(', ')}</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">No salen rutas hacia otros vértices.</p>
            </div>
          </div>
        )}

        {isolatedNodes.length > 0 && (
          <div className="flex items-start gap-3 pt-3 border-t border-amber-200">
            <span className="text-gray-500 text-lg">⚪</span>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Nodos aislados</h4>
              <p className="text-sm text-amber-800 mt-1">
                Vértices: <span className="font-mono font-bold">{isolatedNodes.join(', ')}</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">No tienen conexiones de entrada ni salida.</p>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
                
                {/* Resultado */}
                {pathResult && (
                  <div className={`rounded-xl p-4 ${pathResult.error ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}`}>
                    {pathResult.error ? (
                      <p className="text-sm text-red-700 font-medium">⚠️ {pathResult.error}</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">Camino más corto:</p>
                        <p className="text-lg font-mono font-bold text-slate-900 break-all">
                          {pathResult.path}
                        </p>
                        <p className="text-sm text-slate-600">
                          Peso total: <span className="font-bold text-blue-700">{pathResult.totalCost}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
