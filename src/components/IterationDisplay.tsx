import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IterationData } from '@/utils/simplexSolver';

interface IterationDisplayProps {
  iteration: IterationData;
  isOptimal: boolean;
}

export default function IterationDisplay({ iteration, isOptimal }: IterationDisplayProps) {
  const formatNumber = (num: number): string => {
    return Math.abs(num) < 1e-10 ? '0.0000' : num.toFixed(4);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Iteración {iteration.iteration}
            {isOptimal && <Badge className="ml-3 bg-green-600">Óptima</Badge>}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Variables Básicas (X<sub>B</sub>):</h4>
            <div className="flex flex-wrap gap-2">
              {iteration.basicVariables.map((varIndex, i) => (
                <Badge key={i} variant="outline">
                  x{varIndex + 1} = {formatNumber(iteration.XB[i])}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Variables No Básicas (X<sub>NB</sub>):</h4>
            <div className="flex flex-wrap gap-2">
              {iteration.nonBasicVariables.map((varIndex, i) => (
                <Badge key={i} variant="secondary">
                  x{varIndex + 1} = 0
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-lg font-semibold">Z = {formatNumber(iteration.Z)}</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Matriz Base (B):</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                {iteration.B.data.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((val, j) => (
                      <TableCell key={j} className="text-center font-mono">
                        {formatNumber(val)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            det(B) = {formatNumber(iteration.detB)}
          </p>
        </div>

        {/* Matriz Inversa B^-1 - Forma de Producto */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Inversa B<sup>-1</sup>:</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                {iteration.Binv.data.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((val, j) => (
                      <TableCell key={j} className="text-center font-mono">
                        {formatNumber(val)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Coeficientes CB */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Coeficientes de Variables Básicas (C<sub>B</sub>):</h4>
          <div className="flex flex-wrap gap-2">
            {iteration.CB.map((val, i) => (
              <Badge key={i} variant="outline">
                {formatNumber(val)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Valores Zj - Cj */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Valores Z<sub>j</sub> - C<sub>j</sub>:</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: iteration.ZjCj.length }, (_, i) => (
                    <TableHead key={i} className="text-center">
                      {i + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {iteration.ZjCj.map((val, i) => (
                    <TableCell
                      key={i}
                      className={`text-center font-mono ${
                        val < -1e-6 ? 'bg-red-100 font-bold' : ''
                      }`}
                    >
                      {formatNumber(val)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Variable de Entrada */}
        {iteration.enteringVariable !== null && (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-semibold">
              Variable de Entrada: x<sub>{iteration.enteringVariable + 1}</sub>
              <span className="text-sm text-muted-foreground ml-2">
                (Z<sub>j</sub> - C<sub>j</sub> más negativo = {formatNumber(iteration.ZjCj[iteration.enteringVariable])})
              </span>
            </p>
          </div>
        )}

        {/* Variable de Salida */}
        {iteration.leavingVariable !== null && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="font-semibold">
              Variable de Salida: x<sub>{iteration.leavingVariable + 1}</sub>
              <span className="text-sm text-muted-foreground ml-2">
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}