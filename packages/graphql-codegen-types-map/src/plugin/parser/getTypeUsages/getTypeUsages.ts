import {
  ASTNode,
  ExecutableDefinitionNode,
  GraphQLOutputType,
  SelectionSetNode,
  TypeInfo,
  visit,
  visitWithTypeInfo,
} from 'graphql'
import { ERRORS } from '~/utils'

import {
  flattenParentInfo,
  isSelectionSetParent,
  isSkippableParent,
  FlattenParentInfo,
  FlattenOperationInfo,
  FlattenFragmentInfo,
} from './flattenParent'
import { FlattenTypeInfo, flattenTypeInfo } from './flattenType'

export interface UsagePathNode<Parent extends FlattenParentInfo = FlattenParentInfo> {
  flattenType: FlattenTypeInfo
  flattenParent: Parent
  raw: {
    type: GraphQLOutputType
    node: SelectionSetNode
    parent: ASTNode
  }
}

export interface FragmentUsage {
  name: string
}

export type RootUsagePathNode = UsagePathNode<FlattenOperationInfo | FlattenFragmentInfo>

export interface TypeUsages {
  typePaths: UsagePathNode[][]
  fragmentUsages: FragmentUsage[]
  root: RootUsagePathNode
}

export function getTypeUsages(definitionNode: ExecutableDefinitionNode, typeInfo: TypeInfo): TypeUsages {
  const pathTracker: UsagePathNode[] = []
  const typePaths: UsagePathNode[][] = []
  const fragmentUsages: FragmentUsage[] = []
  let root: RootUsagePathNode | undefined = undefined

  visit(
    definitionNode,
    visitWithTypeInfo(typeInfo, {
      SelectionSet: {
        enter: (node, nodeKey, parent) => {
          if (!isSelectionSetParent(parent)) return ERRORS.unexpectedParentOfSelectionSet(parent)
          if (isSkippableParent(parent)) return

          const type = typeInfo.getType()
          if (!type) return ERRORS.failedToGetType(node)

          const flattenType = flattenTypeInfo(type)
          const flattenParent = flattenParentInfo(parent)

          const typeUsage: UsagePathNode = { flattenType, flattenParent, raw: { type, node, parent } }
          if (parent.kind === 'OperationDefinition' || parent.kind === 'FragmentDefinition') {
            root = typeUsage as RootUsagePathNode
          } else {
            pathTracker.push(typeUsage)
            typePaths.push([...pathTracker])
          }
        },
        leave: (node, nodeKey, parent) => {
          if (!isSelectionSetParent(parent)) return ERRORS.unexpectedParentOfSelectionSet(parent)
          if (isSkippableParent(parent)) return

          if (parent.kind === 'OperationDefinition' || parent.kind === 'FragmentDefinition') {
            return
          }
          pathTracker.pop()
        },
      },
      FragmentSpread: {
        enter: node => {
          fragmentUsages.push({ name: node.name.value })
        },
      },
    })
  )

  if (pathTracker.length !== 0) ERRORS.bugInCode("pathTracker should be an empty array now, but it isn't")
  if (!root) return ERRORS.bugInCode("Root node shouldn't be falsy, but it isn't")

  return { typePaths, fragmentUsages, root }
}
