import { ASTNode, print } from 'graphql'

export const ERRORS = {
  anonymousOperation: (node: ASTNode) => {
    throw new Error(`Anonymous operations are not allowed: ${print(node)}`)
  },
  failedToGetType: (node: ASTNode) => {
    throw new Error(`Failed to get a type of the node: ${print(node)}`)
  },
  unexpected: (extra?: string) => {
    throw new Error(`Unexpected error ocurred${extra ? `: ${extra}` : ''}`)
  },
  unexpectedParentOfSelectionSet: (parent: any) => {
    throw new Error(`Unexpected parent of SelectionSet: ${JSON.stringify(parent?.kind || parent)}`)
  },
  bugInCode: (extra?: string) => {
    throw new Error(`There is a bug in the code${extra ? `: ${extra}` : ''}`)
  },
  invalidTemplate: <V extends {}, O extends {}>(template: string, variables: V, casingOperations: O) => {
    const errorMessage =
      `Invalid variable or function name used in "operationsMap" template. ` +
      `Given template: "${template}". ` +
      `Allowed variables: "${Object.keys(variables).join(', ')}". ` +
      `Allowed functions: "${Object.keys(casingOperations).join(', ')}". ` +
      `Usage example: "{pascalCase(operationName)}{pascalCase(operationKind)}Variables"`
    throw new Error(errorMessage)
  },
}
