import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import flatmap from 'lodash.flatmap'
import fromEntries from 'object.fromentries'

export interface FieldArgsUsage {
  parentName: string
  fieldName: string
}

const getObjectTypes = (schema: GraphQLSchema) => {
  const types = fromEntries(
    Object.entries(schema.getTypeMap())
      .filter(([, type]) => type instanceof GraphQLObjectType)
      .filter(([typeName]) => !typeName.startsWith('__'))
  ) as GraphQLObjectType[]
  return types
}

export const getFieldArgsUsageMap = (schema: GraphQLSchema): FieldArgsUsage[] => {
  const result = flatmap(Object.entries(getObjectTypes(schema)), ([parentName, type]) => {
    const fieldWithArgs = Object.entries(type.getFields()).filter(([, type]) => type.args.length > 0)
    return flatmap(fieldWithArgs, ([fieldName]) => ({ parentName, fieldName }))
  })
  return result
}
