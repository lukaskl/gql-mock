import { ASTNode, FieldNode, InlineFragmentNode, ExecutableDefinitionNode, OperationTypeNode } from 'graphql'
import { ERRORS, unionToArray } from '~/utils'

export interface FlattenFieldInfo {
  kind: 'Field'
  name: string
}
export interface FlattenFragmentInfo {
  kind: 'FragmentDefinition'
  name: string
}
export interface FlattenOperationInfo {
  kind: 'OperationDefinition'
  operationKind: OperationTypeNode
  name: string
}
export interface FlattenInlineFragmentInfo {
  kind: 'InlineFragment'
  typename: string
}

export type FlattenParentInfo =
  | FlattenOperationInfo
  | FlattenFragmentInfo
  | FlattenFieldInfo
  | FlattenInlineFragmentInfo

export type SelectionSetParent = ExecutableDefinitionNode | FieldNode | InlineFragmentNode

export const isSelectionSetParent = (
  parent: ASTNode | readonly ASTNode[] | undefined
): parent is SelectionSetParent => {
  if (!parent || Array.isArray(parent)) return false

  const parentKids = unionToArray<SelectionSetParent['kind']>({
    Field: null,
    FragmentDefinition: null,
    InlineFragment: null,
    OperationDefinition: null,
  })

  return parentKids.includes(parent.kind as SelectionSetParent['kind'])
}

export const flattenParentInfo = (parent: SelectionSetParent): FlattenParentInfo => {
  switch (parent.kind) {
    case 'FragmentDefinition':
      return { kind: parent.kind, name: parent.name.value }
    case 'OperationDefinition':
      return {
        kind: parent.kind,
        operationKind: parent.operation,
        name: parent.name?.value || ERRORS.anonymousOperation(parent),
      }
    case 'Field':
      return { kind: parent.kind, name: parent.alias?.value || parent.name.value }
    case 'InlineFragment': {
      const typename =
        parent.typeCondition?.name.value ||
        ERRORS.unexpected('typeCondition of InlineFragment was expected, but falsy value received')
      return { kind: parent.kind, typename }
    }

    default:
      return ERRORS.unexpectedParentOfSelectionSet(parent)
  }
}

export const isSkippableParent = (parent: SelectionSetParent) => {
  if (parent.kind === 'InlineFragment' && !parent.typeCondition) return true

  return false
}
