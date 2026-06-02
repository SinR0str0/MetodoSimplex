import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConstraintType, ProblemType, VariableType, MilpInput } from '@/utils/milpTypes';

interface RamificacionTableProps {
  numVariables: number;
  numConstraints: number;
  problemType: ProblemType;
  onSolve: (input: MilpInput) => void;
  onBack: () => void;
}

export default function RamificacionTable({ numVariables, numConstraints, problemType, onSolve, onBack }: RamificacionTableProps) {
  const [objectiveCoefficients, setObjectiveCoefficients] = useState<string[]>(Array(numVariables).fill('0'));
  const [variableTypes, setVariableTypes] = useState<VariableType[]>(Array(numVariables).fill('continuous'));
  const [constraints, setConstraints] = useState<{ coefficients: string[]; type: ConstraintType; rhs: string }[]>(
    Array(numConstraints).fill(null).map(() => ({ coefficients: Array(numVariables).fill('0'), type: '<=' as ConstraintType, rhs: '0' }))
  );

  const handleSolve = () => {

    const hasNonContinuous = variableTypes.some(type => type !== 'continuous');
    
    if (!hasNonContinuous) {
      alert(
        '⚠️ Advertencia:\n\n' +
        'Todas las variables están configuradas como "Continuas".\n\n' +
        'El método de Ramificación y Acotamiento está diseñado para problemas con al menos una variable entera o binaria.\n\n' +
        'Si su problema solo tiene variables continuas, es más eficiente y adecuado utilizar el Método Simplex.'
      );
      return; // Detiene la ejecución y no envía los datos al backend
    }

    try {
      const input: MilpInput = {
        numVariables,
        numConstraints,
        problemType,
        objectiveCoefficients: objectiveCoefficients.map((c) => parseFloat(c) || 0),
        variableTypes: variableTypes,
        constraints: constraints.map((c) => ({
          coefficients: c.coefficients.map((coef) => parseFloat(coef) || 0),
          type: c.type,
          rhs: parseFloat(c.rhs) || 0,
        })),
      };
      
      if (input.constraints.some((c) => c.rhs < 0)) {
        alert('Error: Todos los términos independientes (lado derecho) deben ser no negativos');
        return;
      }
      onSolve(input);
    } catch (error) {
      alert('Error al procesar los datos. Verifique que todos los valores sean numéricos.');
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Tabla de Entrada de Datos</CardTitle>
        <CardDescription>Ingrese los coeficientes y seleccione el tipo de cada variable</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Z</TableHead>
                {Array.from({ length: numVariables }, (_, i) => (
                  <TableHead key={i} className="text-center relative">x<sub>{i + 1}</sub></TableHead>
                ))}
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Solución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Función Objetivo */}
              <TableRow className="bg-emerald-50">
                <TableCell className="font-medium">Función Objetivo</TableCell>
                {Array.from({ length: numVariables }, (_, i) => (
                  <TableCell key={i} className="relative">
                    <Input type="number" step="any" value={objectiveCoefficients[i]} onChange={(e) => setObjectiveCoefficients(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} className="w-20 text-center mx-auto" />
                    {i < numVariables - 1 && <span className="absolute right-[-6px] top-[50%] transform -translate-y-[50%] text-gray-500 font-bold">+</span>}
                  </TableCell>
                ))}
                <TableCell className="text-center"><span className="font-medium">{problemType === 'max' ? 'Max' : 'Min'}</span></TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Restricciones */}
              {Array.from({ length: numConstraints }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">Restricción {i + 1}</TableCell>
                  {Array.from({ length: numVariables }, (_, j) => (
                    <TableCell key={j} className="relative">
                      <Input type="number" step="any" value={constraints[i].coefficients[j]} onChange={(e) => setConstraints(prev => { const n = [...prev]; n[i].coefficients[j] = e.target.value; return n; })} className="w-20 text-center mx-auto" />
                      {j < numVariables - 1 && <span className="absolute right-[-6px] top-[50%] transform -translate-y-[50%] text-gray-500 font-bold">+</span>}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Select value={constraints[i].type} onValueChange={(value) => setConstraints(prev => { const n = [...prev]; n[i].type = value as ConstraintType; return n; })}>
                      <SelectTrigger className="w-20 text-center mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<=">≤</SelectItem>
                        <SelectItem value=">=">≥</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" step="any" value={constraints[i].rhs} onChange={(e) => setConstraints(prev => { const n = [...prev]; n[i].rhs = e.target.value; return n; })} className="w-20 text-center mx-auto" />
                  </TableCell>
                </TableRow>
              ))}

              {/* Selector de Tipo de Variable (NUEVO) */}
              <TableRow className="bg-purple-50">
                <TableCell className="font-medium">Tipo de Variable</TableCell>
                {Array.from({ length: numVariables }, (_, i) => (
                  <TableCell key={i}>
                    <Select value={variableTypes[i]} onValueChange={(value) => setVariableTypes(prev => { const n = [...prev]; n[i] = value as VariableType; return n; })}>
                      <SelectTrigger className="w-24 text-center mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continua</SelectItem>
                        <SelectItem value="integer">Entera</SelectItem>
                        <SelectItem value="binary">Binaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                ))}
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" onClick={onBack}>Volver</Button>
          <Button onClick={handleSolve} className="px-8 bg-emerald-600 hover:bg-emerald-700">Resolver con Ramificación</Button>
        </div>
      </CardContent>
    </Card>
  );
}