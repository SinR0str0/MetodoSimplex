'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { runFloydWarshallSteps, type FloydStep } from '@/utils/floyd';
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

  // Validar entrada numérica
  const isValidInput = (value: number): boolean => {
    return Number.isInteger(value) && value > 0 && value < 11;
  };

  // Obtener etiquetas de vértices
  const getVertexLabels = useCallback((): string[] => {
    if (vertices === 0) return [];
    return Array.from({ length: vertices }, (_, i) => `${i + 1}`);
  }, [vertices]);

  // Calcular posición de nodo en circunferencia
  const getNodePosition = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Dibujar flecha dirigida
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

    // Punto final ajustado al borde del nodo destino
    const endX = toX - (dx / dist) * nodeRadius;
    const endY = toY - (dy / dist) * nodeRadius;

    // Línea
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cabeza de flecha
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

    const labels = getVertexLabels();
    if (labels.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ingresa el número de vértices para comenzar', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Configurar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
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
        // Texto del costo en bucle
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(rel.cost), from.x + nodeRadius * 1.6, from.y - nodeRadius * 1.4);
      } else {
        drawArrow(ctx, from.x, from.y, to.x, to.y, nodeRadius);
        
        // Texto del costo en arista (punto medio con desplazamiento)
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 10, midY - 8, 20, 12); // Fondo blanco para legibilidad
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

      // Círculo del nodo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Texto del nodo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y);
    });
  }, [vertices, relations, getVertexLabels]);

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
    setCurrentStepIdx(0); // Inicia en k=0
    setShowResults(true);
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
    // Limpiar canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
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
                width={640}
                height={440}
                className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-slate-50"
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
        {/* Selector de iteración */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center gap-4">
          {/* ... tu código del slider ... */}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
            Modificado en k={steps[currentStepIdx].k}
          </span>
          {steps[currentStepIdx].cambios.length > 0 && (
            <span className="text-gray-400">
              • {steps[currentStepIdx].cambios.length} cambio(s)
            </span>
          )}
        </div>
        
        {/* Selector de iteración */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center gap-4">
          <label className="font-medium text-gray-700">Iteración (k):</label>
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={currentStepIdx}
            onChange={(e) => setCurrentStepIdx(Number(e.target.value))}
            className="w-full max-w-xs accent-blue-600"
          />
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
            k = {steps[currentStepIdx].k}
          </span>
          <span className="text-sm text-gray-500">
            {steps.length - 1} iteraciones disponibles
          </span>
        </div>

        {steps[currentStepIdx].tieneCicloNegativo && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-red-800">Ciclo Negativo Detectado</h3>
                <p className="mt-1 text-sm text-red-700">
                  Los vértices {steps[currentStepIdx].verticesCicloNegativo.join(', ')} tienen camino negativo a sí mismos. 
                  Los costos mínimos no son estables.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Matriz de Costos (C) */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Matriz de Costos (D)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 font-semibold">V\V</th>
                  {Array.from({ length: vertices }, (_, i) => (
                    <th key={i} className="border p-2 font-semibold">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
               {steps[currentStepIdx].D.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2 font-bold bg-gray-50">{i + 1}</td>
                  {row.map((cell, j) => {
                    const fueModificado = steps[currentStepIdx].cambios?.some(
                      c => c.i === i + 1 && c.j === j + 1
                    );
                    return (
                      <td 
                        key={j} 
                        className={`border p-2 text-center ${fueModificado ? 'bg-green-100 font-bold text-green-800' : ''}`}
                      >
                        {cell === Infinity ? '∞' : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matriz de Predecesores (Z) */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Matriz de Predecesores (Z)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 font-semibold">V\V</th>
                  {Array.from({ length: vertices }, (_, i) => (
                    <th key={i} className="border p-2 font-semibold">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {steps[currentStepIdx].Z.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border p-2 font-bold bg-gray-50">{i + 1}</td>
                    {row.map((cell, j) => {
                      const fueModificado = steps[currentStepIdx].cambios?.some(
                        c => c.i === i + 1 && c.j === j + 1
                      );
                      return (
                        <td 
                          key={j} 
                          className={`border p-2 text-center ${fueModificado ? 'bg-green-100 font-bold text-green-800' : ''}`}
                        >
                          {cell === null ? '-' : cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div> 
    )}
    </div>
  );
}