import { VariableType } from './milpTypes';

export function getModelType(variableTypes: VariableType[]): string {
  const hasContinuous = variableTypes.includes('continuous');
  const hasInteger = variableTypes.includes('integer') || variableTypes.includes('natural');
  const hasBinary = variableTypes.includes('binary');

  if (!hasContinuous && !hasInteger && hasBinary) return 'Binario';
  if (!hasContinuous && hasInteger && !hasBinary) return 'Entero Puro';
  if (hasInteger && hasBinary) return 'Entero Mixto';
  if (hasContinuous && (hasInteger || hasBinary)) return 'Mixto';
  
  return 'Continuo';
}