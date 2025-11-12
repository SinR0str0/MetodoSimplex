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
        {/* Información de Variables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Variables Básicas (Xb):</h4>
            <div className="flex flex-wrap gap-2">
              {iteration.basicVariables.map((varIndex, i) => (
                <Badge key={i} variant="outline">
                  x{varIndex + 1} = {formatNumber(iteration.XB[i])}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Variables No Básicas (XNB):</h4>
            <div className="flex flex-wrap gap-2">
              {iteration.nonBasicVariables.map((varIndex) => (
                <Badge key={varIndex} variant="secondary">
                  x{varIndex + 1} = 0
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Valor de Z */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-lg font-semibold">
            Z = {formatNumber(iteration.Z)}
          </p>
        </div>

        {/* Matriz Base B */}
        <div className="space-y-2">
          <h4 className="font-semibold">Matriz Base (B):</h4>
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
          <p className="text-sm text-muted-foreground">
            det(B) = {formatNumber(iteration.detB)}
          </p>
        </div>

        {/* Matriz Inversa B^-1 */}
        <div className="space-y-2">
          <h4 className="font-semibold">Inversa de B (B⁻¹) - Forma de Producto:</h4>
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
          <h4 className="font-semibold">Coeficientes de Variables Básicas (CB):</h4>
          <div className="flex gap-2">
            {iteration.CB.map((val, i) => (
              <Badge key={i} variant="outline">
                {formatNumber(val)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Valores Zj - Cj */}
        <div className="space-y-2">
          <h4 className="font-semibold">Valores Zj - Cj:</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {iteration.ZjCj.map((_, i) => (
                    <TableHead key={i} className="text-center">x{i + 1}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {iteration.ZjCj.map((val, i) => (
                    <TableCell 
                      key={i} 
                      className={`text-center font-mono ${val < -1e-6 ? 'bg-red-100 font-bold' : ''}`}
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
              Variable de Entrada: x{iteration.enteringVariable + 1}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Zj - Cj más negativo = {formatNumber(iteration.ZjCj[iteration.enteringVariable])})
              </span>
            </p>
          </div>
        )}

        {/* Variable de Salida */}
        {iteration.leavingVariable !== null && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="font-semibold">
              Variable de Salida: x{iteration.leavingVariable + 1}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Razón mínima)
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}