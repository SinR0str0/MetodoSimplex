import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProblemType } from '@/utils/simplexSolver';

interface InputFormProps {
  onSubmit: (numVariables: number, numConstraints: number, problemType: ProblemType) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
  const [numVariables, setNumVariables] = useState<string>('2');
  const [numConstraints, setNumConstraints] = useState<string>('2');
  const [problemType, setProblemType] = useState<ProblemType>('max');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vars = parseInt(numVariables);
    const constraints = parseInt(numConstraints);

    if (vars < 1 || vars > 100) {
      alert('El número de variables debe estar entre 1 y 100');
      return;
    }

    if (constraints < 1 || constraints > 100) {
      alert('El número de restricciones debe estar entre 1 y 100');
      return;
    }

    onSubmit(vars, constraints, problemType);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Método Simplex Revisado</CardTitle>
        <CardDescription>Ingrese los parámetros del problema de optimización</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numVariables">Número de Variables</Label>
              <Input
                id="numVariables"
                type="number"
                min="1"
                max="100"
                value={numVariables}
                onChange={(e) => setNumVariables(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numConstraints">Número de Restricciones</Label>
              <Input
                id="numConstraints"
                type="number"
                min="1"
                max="100"
                value={numConstraints}
                onChange={(e) => setNumConstraints(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problemType">Tipo de Problema</Label>
            <Select value={problemType} onValueChange={(value) => setProblemType(value as ProblemType)}>
              <SelectTrigger id="problemType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="max">Maximización</SelectItem>
                <SelectItem value="min">Minimización</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Generar Tabla de Entrada
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}