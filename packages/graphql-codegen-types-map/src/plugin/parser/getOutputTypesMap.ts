import { GraphQLSchema, GraphQLNullableType } from 'graphql'
import { ERRORS } from '~/utils'

export type GraphQLSchemaOutputTypes = 'enum' | 'scalar' | 'object' | 'interface' | 'union'
export type GraphQLSchemaTypes = GraphQLSchemaOutputTypes | 'inputObject'

const typeToLiteral = (type: GraphQLNullableType): GraphQLSchemaTypes => {
  const typeName = type.constructor.name
  switch (typeName) {
    case 'GraphQLEnumType':
      return 'enum'
    case 'GraphQLInputObjectType':
      return 'inputObject'
    case 'GraphQLInterfaceType':
      return 'interface'
    case 'GraphQLObjectType':
      return 'object'
    case 'GraphQLScalarType':
      return 'scalar'
    case 'GraphQLUnionType':
      return 'union'
    default:
      return ERRORS.unexpected(`Unexpected typeName "${typeName}" of ${type.inspect()}`)
  }
}

export interface OutputTypeEntry {
  kind: GraphQLSchemaOutputTypes
  name: string
}

export const getAllOutputTypesMap = (schema: GraphQLSchema): OutputTypeEntry[] => {
  const types = schema.getTypeMap()
  const outputTypes = Object.entries(types)
    .map(([key, type]) => {
      if (key.startsWith('__')) return
      const typeKind = typeToLiteral(type)

      if (typeKind === 'inputObject') return

      const result: OutputTypeEntry = { kind: typeKind, name: key }
      return result
    })
    .filter(x => !!x) as OutputTypeEntry[]
  return outputTypes
}
