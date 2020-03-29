import { ASTNode, DocumentNode, VariableDefinitionNode, visit, OperationTypeNode, print } from 'graphql'

export interface OperationsMapEntry {
  operationName: string
  hasVariables: boolean
  operationKind: OperationTypeNode
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
  const operations: OperationsMapEntry[] = []
  visit(allAst, {
    leave: {
      OperationDefinition: node => {
        const name = node.name?.value
        if (!name) {
          throw new Error(`Anonymous operations are not allowed: ${print(node)}`)
        }
        const operationKind = node?.operation
        const variables = getVariablesAst(node)
        operations.push({
          operationName: name,
          hasVariables: !!variables,
          operationKind,
        })
      },
    },
  })
  return operations
}
