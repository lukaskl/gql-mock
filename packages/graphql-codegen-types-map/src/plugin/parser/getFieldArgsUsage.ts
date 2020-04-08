import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import fromEntries from 'object.fromentries'

export type FieldArgsUsageEntry = [string, string[]]
export interface FieldArgsUsages {
  [parentName: string]: string[]
}

const getObjectTypes = (schema: GraphQLSchema) => {
  const types = fromEntries(
    Object.entries(schema.getTypeMap())
      .filter(([, type]) => type instanceof GraphQLObjectType)
      .filter(([typeName]) => !typeName.startsWith('__'))
  ) as GraphQLObjectType[]
  return types
}

export const getFieldArgsUsageMap = (schema: GraphQLSchema): FieldArgsUsages => {
  const entries = Object.entries(getObjectTypes(schema))
    .map(([parentName, type]) => {
      const fieldWithArgs = Object.entries(type.getFields())
        .filter(([, type]) => type.args.length > 0)
        .map(([fieldName]) => fieldName)
      return [parentName, fieldWithArgs] as FieldArgsUsageEntry
    })
    .filter(([, fieldsWithArgs]) => fieldsWithArgs.length > 0)

  return fromEntries(entries)
}
