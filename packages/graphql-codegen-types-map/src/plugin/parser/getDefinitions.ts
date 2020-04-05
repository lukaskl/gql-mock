import { ASTKindToNode, ASTNode, BREAK, DocumentNode, KindEnum, VariableDefinitionNode, visit } from 'graphql'
import { ERRORS } from '~/utils'

const filterDefinitions = <T extends KindEnum>(allAst: DocumentNode, kind: T): ASTKindToNode[T][] =>
  allAst.definitions.filter(d => d.kind === kind) as ASTKindToNode[T][]

export const getVariablesAst = (node: ASTNode): VariableDefinitionNode | undefined => {
  let variable: VariableDefinitionNode | undefined = undefined
  visit(node, {
    VariableDefinition: node => {
      variable = node
      return BREAK
    },
  })

  return variable
}

export const getFragments = (allAst: DocumentNode) => {
  return filterDefinitions(allAst, 'FragmentDefinition').map(node => ({
    node,
    name: node.name.value,
    onType: node.typeCondition.name.value,
  }))
}

export const getOperations = (allAst: DocumentNode) => {
  return filterDefinitions(allAst, 'OperationDefinition').map(node => ({
    node: node,
    name: node.name ? node.name.value : ERRORS.anonymousOperation(node),
    kind: node.operation,
    variables: getVariablesAst(node),
  }))
}
