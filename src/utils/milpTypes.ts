export type ProblemType = 'max' | 'min';
export type ConstraintType = '<=' | '>=' | '=';
export type VariableType = 'continuous' | 'integer' | 'natural' | 'binary';

export interface MilpInput {
  numVariables: number;
  numConstraints: number;
  problemType: ProblemType;
  objectiveCoefficients: number[];
  variableTypes: VariableType[];
  constraints: {
    coefficients: number[];
    type: ConstraintType;
    rhs: number;
  }[];
}