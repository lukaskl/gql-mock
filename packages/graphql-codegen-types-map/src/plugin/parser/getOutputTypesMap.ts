import { GraphQLSchema, GraphQLNullableType } from 'graphql'
import { ERRORS } from '~/utils'

export type GraphQLSchemaOutputTypes = 'enum' | 'object' | 'interface' | 'union'
export type GraphQLSchemaTypes = GraphQLSchemaOutputTypes | 'inputObject' | 'scalar'

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

export interface OutputTypeEntry<Kinds extends string> {
  kind: Kinds
  name: string
}

export const getTypesMap = <T extends GraphQLSchemaTypes>(
  schema: GraphQLSchema,
  ...exclude: T[]
): OutputTypeEntry<Extract<GraphQLSchemaTypes, T>>[] => {
  const types = schema.getTypeMap()
  const outputTypes = Object.entries(types)
    .map(([key, type]) => {
      if (key.startsWith('__')) return
      const typeKind = typeToLiteral(type)

      if (!exclude.includes(typeKind as any)) return

      const result = { kind: typeKind, name: key }
      return result
    })
    .filter(x => !!x)
  return outputTypes as OutputTypeEntry<Extract<GraphQLSchemaTypes, T>>[]
}
