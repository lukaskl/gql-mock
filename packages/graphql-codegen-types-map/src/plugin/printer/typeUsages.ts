import { Types } from '@graphql-codegen/plugin-helpers'
import uniq from 'lodash.uniq'
import { TypeUsages, UsagePathNode } from '~/plugin/parser'
import { ERRORS } from '~/utils'

import { expandTemplate, OperationTemplateVariables } from './expandTemplate'

const printPathToType = (typePath: UsagePathNode[], typeStr = ''): string => {
  if (typePath.length === 0) return typeStr
  const [currentType, ...remaining] = typePath
  const { flattenParent, flattenType } = currentType
  const isLastNode = remaining.length === 0
  switch (flattenParent.kind) {
    case 'Field':
      typeStr += `['${flattenParent.name}']`
      if (flattenType.array === 'nullable') {
        typeStr = `NN<${typeStr}>`
      }
      if (flattenType.array) {
        typeStr = `${typeStr}[0]`
      }
      if (!isLastNode && flattenType.type.isNullable) {
        typeStr = `NN<${typeStr}>`
      }
      break
    case 'InlineFragment':
      typeStr = `UU<${typeStr}, '${flattenParent.typename}'>`
      break
    default:
      return ERRORS.bugInCode()
  }

  return printPathToType(remaining, typeStr)
}

interface TypeUsageCommonProperties {
  importRef: string
  operationTypeTemplate: string
  typeUsagesTemplate: string
}

interface PrintSingleTypeUsagesProps extends TypeUsageCommonProperties {
  typeUsages: TypeUsages
}

const printSingleTypeUsages = (props: PrintSingleTypeUsagesProps): string => {
  const { importRef, operationTypeTemplate, typeUsagesTemplate, typeUsages } = props
  const { root, typePaths, fragmentUsages } = typeUsages

  const { flattenParent } = root

  const templateVariables: OperationTemplateVariables = {
    operationName: flattenParent.name,
    operationKind: flattenParent.kind === 'FragmentDefinition' ? 'fragment' : flattenParent.operationKind,
  }

  const rootStr = importRef + expandTemplate(operationTypeTemplate, templateVariables)

  const fieldUsageEntries = typePaths.map(path => {
    const forType = path[path.length - 1]
    const forTypeName = forType.flattenType.type.name
    const pathToType = printPathToType(path, rootStr)
    return { pathToType, forTypeName }
  })

  fieldUsageEntries.push({
    forTypeName: root.flattenType.type.name,
    pathToType: rootStr,
  })

  const fragmentUsageEntries = uniq(fragmentUsages.map(x => x.name)).map(x =>
    expandTemplate(typeUsagesTemplate, {
      operationKind: 'fragment',
      operationName: x,
    })
  )

  const allEntries = [
    ...fieldUsageEntries.map(type => `{ ${type.forTypeName}: ${type.pathToType} }`),
    ...fragmentUsageEntries,
  ]

  return `export type ${expandTemplate(typeUsagesTemplate, templateVariables)} = ${allEntries.join(' &\n  ')}`
}

export interface PrintTypeUsagesProps extends TypeUsageCommonProperties {
  typeUsagesList: TypeUsages[]
}

const prepend = [
  `type NonNullable<T> = T extends null | undefined ? never : T`,
  `type NN<T> = NonNullable<T>`,

  `type UnwrapUnion<T, K> = T extends { __typename: K } ? T : never`,
  `type UU<T, K> = UnwrapUnion<T, K>`,
]

export const printTypeUsages = (props: PrintTypeUsagesProps): Types.ComplexPluginOutput => {
  const { typeUsagesList, ...rest } = props

  const usageTypeEntries = typeUsagesList.map(typeUsages => printSingleTypeUsages({ typeUsages, ...rest }))

  const content = usageTypeEntries.join('\n\n  ')

  return { content, prepend }
}
