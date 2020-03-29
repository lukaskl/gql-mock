import { ASTNode, DocumentNode, VariableDefinitionNode, visit, OperationTypeNode } from 'graphql'

export interface OperationsMapEntry {
  operationName: string
  hasVariables: boolean
  operation: OperationTypeNode
}

export const getVariablesAst = (node: ASTNode) => {
  let variable: VariableDefinitionNode | undefined = undefined
  visit(node, {
    VariableDefinition: node => {
      variable = node
    },
  })

  return variable
}

export const getOperationsMap = (allAst: DocumentNode) => {
  let unknownCounter = 0

  const operations: OperationsMapEntry[] = []
  visit(allAst, {
    leave: {
      OperationDefinition: node => {
        const name = node.name?.value || 'Unknown_' + ++unknownCounter
        const operation = node?.operation
        const variables = getVariablesAst(node)
        operations.push({
          operationName: name,
          hasVariables: !!variables,
          operation,
        })
      },
    },
  })
  return operations
}
