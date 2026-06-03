import { useState, useRef, useEffect } from 'react';

interface TreeNodeData {
  id: string;
  level: number;
  solution: { z: number; x: number[] } | null;
  status: 'pending' | 'solving' | 'feasible' | 'infeasible' | 'pruned' | 'branched' | 'unbounded';
  branchingVar: number | null;
  children: TreeNodeData[];
}

interface BranchingTreeDisplayProps {
  tree: TreeNodeData | null;
  variableTypes: string[];
  zCota: number;
  bestSolutionVector: number[] | null;
  problemType: 'max' | 'min';
  isUnbounded?: boolean; // 🚨 PROP AGREGADA
}

// 🚨 AGREGADO: Desestructurar isUnbounded
export default function BranchingTreeDisplay({ 
  tree, 
  variableTypes, 
  zCota, 
  bestSolutionVector, 
  problemType,
  isUnbounded = false // 🚨 VALOR POR DEFECTO
}: BranchingTreeDisplayProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number): string => Math.abs(num) < 1e-5 ? '0' : num.toFixed(2);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const getNodeColors = (status: TreeNodeData['status']) => {
    switch (status) {
      case 'unbounded': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'feasible': return 'border-green-500 bg-green-50 text-green-800';
      case 'infeasible': return 'border-red-500 bg-red-50 text-red-800';
      case 'pruned': return 'border-gray-400 bg-gray-100 text-gray-500 line-through';
      case 'solving': return 'border-blue-500 bg-blue-100 text-blue-800 animate-pulse';
      default: return 'border-gray-300 bg-white text-gray-800';
    }
  };

  const renderNode = (node: TreeNodeData) => {
    if (!node) return null;

    const varsString = node.solution 
      ? `(${node.solution.x.map((v, i) => `x${i+1}=${formatNumber(v)}`).join(', ')})`
      : '...';

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className={`w-72 rounded-lg border-2 shadow-md transition-all duration-300 p-4 ${getNodeColors(node.status)}`}>
          <div className="text-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Nodo {node.id}</span>
            {node.branchingVar !== null && (
              <div className="text-xs mt-1 font-semibold">
                Ramificar: x{node.branchingVar + 1}
              </div>
            )}
          </div>
          
          <div className="text-center mb-3">
            <div className="text-2xl font-bold">Z = {node.solution ? formatNumber(node.solution.z) : '?'}</div>
            <div className="text-sm font-mono mt-1 opacity-80">{varsString}</div>
          </div>

          <div className="text-center text-xs font-semibold uppercase">
            {node.status === 'unbounded' && '∞ No Acotado'}
            {node.status === 'feasible' && '✓ Solución Factible'}
            {node.status === 'infeasible' && '✗ No Factible'}
            {node.status === 'pruned' && '⊘ Agotado'}
            {node.status === 'branched' && '↕ Ramificado'}
            {node.status === 'pending' && '⏳ Pendiente'}
            {node.status === 'solving' && '⚙️ Resolviendo...'}
          </div>
        </div>

        {node.children.length > 0 && <div className="w-0.5 h-8 bg-gray-400"></div>}

        {node.children.length > 0 && (
          <div className="flex gap-8 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[calc(100%-12rem)] h-0.5 bg-gray-400"></div>
            )}
            {node.children.map((child, index) => {
              const varIdx = node.branchingVar ?? 0;
              
              // 🚨 AGREGADO: Manejo de variables binarias
              const isBinary = variableTypes[varIdx] === 'binary';
              let constraintLabel = '';
              
              if (isBinary) {
                constraintLabel = index === 0 ? `x${varIdx + 1} = 0` : `x${varIdx + 1} = 1`;
              } else {
                const val = node.solution?.x[varIdx] ?? 0;
                const floor = Math.floor(val);
                const ceil = Math.ceil(val);
                constraintLabel = index === 0 ? `x${varIdx + 1} ≤ ${floor}` : `x${varIdx + 1} ≥ ${ceil}`;
              }

              return (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-gray-400 relative flex justify-center">
                    <span className={`absolute -top-3 px-2 py-0.5 text-[11px] font-bold border rounded shadow-sm whitespace-nowrap z-10 ${
                      isBinary ? 'bg-purple-50 text-purple-700 border-purple-300' : 'bg-white text-gray-700 border-gray-300'
                    }`}>
                      {constraintLabel}
                    </span>
                  </div>
                  
                  {renderNode(child)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  if (!tree) return <div className="text-center text-gray-500">Esperando solución...</div>;

  const formatVector = (vec: number[] | null) => {
    if (!vec) return '(...)';
    return `(${vec.map((v, i) => `${formatNumber(v)}`).join(', ')})`;
  };

  return (
    <div className="w-full">
      {/* 🚨 AGREGADO: ALERTA GLOBAL SI ES NO ACOTADO */}
      {isUnbounded && (
        <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-500 rounded-lg text-center">
          <p className="text-lg font-bold text-orange-800">
            ⚠️ El problema es NO ACOTADO
          </p>
          <p className="text-sm text-orange-700 mt-1">
            La función objetivo puede {problemType === 'max' ? 'crecer infinitamente' : 'decrecer infinitamente'}. 
            No existe solución óptima finita.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-col md:flex-row justify-center items-center gap-4 text-sm bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">Cota Actual (Z*):</span>
          <span className="text-xl font-bold text-emerald-600">
            {zCota === (problemType === 'max' ? -Infinity : Infinity) 
              ? (problemType === 'max' ? '-∞' : '∞') 
              : formatNumber(zCota)}
          </span>
        </div>
        
        {bestSolutionVector && (
          <div className="flex items-center gap-2 border-l-2 border-gray-200 pl-4">
            <span className="font-bold text-gray-700">Solución Óptima:</span>
            <span className="text-lg font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-200">
              {formatVector(bestSolutionVector)}
            </span>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="border-2 border-gray-200 rounded-lg bg-gray-50 overflow-hidden relative select-none"
        style={{ height: '70vh', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            +
          </button>
          <button 
            onClick={() => setScale(prev => Math.max(0.3, prev * 0.8))}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            -
          </button>
          <button 
            onClick={resetView}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            ⟲
          </button>
        </div>

        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s'
          }}
        >
          <div className="p-8 min-w-max">
            {renderNode(tree)}
          </div>
        </div>
      </div>

      {/* 🚨 AGREGADO: Cuadro naranja en la leyenda */}
      <div className="mt-6 flex justify-center gap-6 text-xs flex-wrap">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-50 border-2 border-orange-500"></div><span>No Acotado</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-50 border-2 border-green-500"></div><span>Factible (Entero)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-50 border-2 border-red-500"></div><span>No Factible</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border-2 border-gray-300"></div><span>Pendiente / Ramificado</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-400 line-through"></div><span>Agotado</span></div>
      </div>
    </div>
  );
}