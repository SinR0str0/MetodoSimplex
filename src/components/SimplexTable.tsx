import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConstraintType, ProblemType, SimplexInput } from '@/utils/simplexSolver';

interface SimplexTableProps {
  numVariables: number;
  numConstraints: number;
  problemType: ProblemType;
  onSolve: (input: SimplexInput) => void;
  onBack: () => void;
}

export default function SimplexTable({
  numVariables,
  numConstraints,
  problemType,
  onSolve,
  onBack,
}: SimplexTableProps) {
  const [objectiveCoefficients, setObjectiveCoefficients] = useState<string[]>(
    Array(numVariables).fill('0')
  );

  const [constraints, setConstraints] = useState<{
    coefficients: string[];
    type: ConstraintType;
    rhs: string;
  }[]>(
    Array(numConstraints)
      .fill(null)
      .map(() => ({
        coefficients: Array(numVariables).fill('0'),
        type: '<=' as ConstraintType,
        rhs: '0',
      }))
  );

  const handleObjectiveChange = (index: number, value: string) => {
    const newCoefficients = [...objectiveCoefficients];
    newCoefficients[index] = value;
    setObjectiveCoefficients(newCoefficients);
  };

  const handleConstraintCoefficientChange = (constraintIndex: number, varIndex: number, value: string) => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].coefficients[varIndex] = value;
    setConstraints(newConstraints);
  };

  const handleConstraintTypeChange = (constraintIndex: number, type: ConstraintType) => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].type = type;
    setConstraints(newConstraints);
  };

  const handleRhsChange = (constraintIndex: number, value: string) => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].rhs = value;
    setConstraints(newConstraints);
  };

  const handleSolve = () => {
    try {
      const input: SimplexInput = {
        numVariables,
        numConstraints,
        problemType,
        objectiveCoefficients: objectiveCoefficients.map((c) => parseFloat(c) || 0),
        constraints: constraints.map((c) => ({
          coefficients: c.coefficients.map((coef) => parseFloat(coef) || 0),
          type: c.type,
          rhs: parseFloat(c.rhs) || 0,
        })),
      };

      // Validar que todos los RHS sean no negativos
      const hasNegativeRhs = input.constraints.some((c) => c.rhs < 0);
      if (hasNegativeRhs) {
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
        <CardDescription>Ingrese los coeficientes de la función objetivo y las restricciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Zj - Cj</TableHead>
                {Array.from({ length: numVariables }, (_, i) => (
                  <TableHead key={i} className="text-center relative">
                    x<sub>{i + 1}</sub>
                  </TableHead>
                ))}
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Solución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Fila de Función Objetivo */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-medium">Función Objetivo</TableCell>
                {Array.from({ length: numVariables }, (_, i) => (
                  <TableCell key={i} className='relative'>
                    <Input
                      type="number"
                      step="any"
                      value={objectiveCoefficients[i]}
                      onChange={(e) => handleObjectiveChange(i, e.target.value)}
                      className="w-20 text-center mx-auto"
                    />
                    {/* Añadir el + después del input, si no es la última columna */}
                    {i < numVariables - 1 && (
                      <span className="absolute right-[-6px] top-[50%] transform -translate-y-[50%] text-gray-500 font-bold">
                        +
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <span className="font-medium">{problemType === 'max' ? 'Max' : 'Min'}</span>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Filas de Restricciones */}
              {Array.from({ length: numConstraints }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">Restricción {i + 1}</TableCell>
                  {Array.from({ length: numVariables }, (_, j) => (
                    <TableCell key={j} className='relative'>
                      <Input
                        type="number"
                        step="any"
                        value={constraints[i].coefficients[j]}
                        onChange={(e) => handleConstraintCoefficientChange(i, j, e.target.value)}
                        className="w-20 text-center mx-auto"
                      />
                      {/* Añadir el + después del input, si no es la última columna */}
                      {j < numVariables - 1 && (
                        <span className="absolute right-[-6px] top-[50%] transform -translate-y-[50%] text-gray-500 font-bold">
                          +
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Select
                      value={constraints[i].type}
                      onValueChange={(value) => handleConstraintTypeChange(i, value as ConstraintType)}
                    >
                      <SelectTrigger className="w-20 text-center mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<=">≤</SelectItem>
                        <SelectItem value=">=">≥</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      value={constraints[i].rhs}
                      onChange={(e) => handleRhsChange(i, e.target.value)}
                      className="w-20 text-center mx-auto"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button variant = "outline" onClick={onBack}>Volver</Button>
          <Button onClick={handleSolve} className="px-8">Resolver</Button>
        </div>
      </CardContent>
    </Card>
  );
}