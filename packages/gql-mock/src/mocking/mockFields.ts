import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLList,
  responsePathAsArray,
  GraphQLField,
  getNullableType,
  getNamedType,
  GraphQLScalarType,
} from 'graphql'
import { forEachField } from 'graphql-tools'
import merge from 'lodash.merge'

export const MAGIC_CONTEXT_MOCKS = '__MOCKS-2ba176b7-1636-4cc8-a9cd-f0dcf9c09761'

export interface MockFieldsOptions {
  schema: GraphQLSchema
}

function mockFields({ schema }: MockFieldsOptions): void {
  if (!schema) {
    throw new Error('Must provide schema to mock')
  }
  if (!(schema instanceof GraphQLSchema)) {
    throw new Error('Value at "schema" must be of type GraphQLSchema')
  }

  forEachField(schema, (field: GraphQLField<any, any>, typeName: string, rawFieldName: string) => {
    const oldResolver = field.resolve
    field.resolve = (root, args, context, info) => {
      const fieldType = getNullableType(field.type)
      const fieldTypeName = getNamedType(fieldType).name
      const path = responsePathAsArray(info.path)

      /**
       * Field name can be changed with an alias
       * Therefore it is safer to pick it from the path
       */
      const fieldName = path[path.length - 1]

      /**
       * It is possible to pass deeply nested value
       * And we assume that nested value takes higher
       * priority than broader resolver
       */
      const existingValue = (root || {})[fieldName]

      const { [MAGIC_CONTEXT_MOCKS]: mocks, ...restContext } = context || {}

      // TODO - figure it out what to do with existing resolvers
      const previousResolvers = oldResolver ? [oldResolver] : []

      // TODO - implement type (not field) resolved value caching
      const cacheKey = [
        info.operation.operation + info.operation.loc?.start,
        ...path.slice(0, path.length - 1),
      ].join('.')

      // implements mocks merging
      const fieldTypeMock = mocks[typeName]
      const resolvedTypeMock: {} | undefined =
        typeof fieldTypeMock === 'function' ? fieldTypeMock(root, args, restContext, info) : fieldTypeMock

      const resolvedFieldMock = (resolvedTypeMock || {})[fieldName]

      // TODO - split this whole function by type
      if (fieldType instanceof GraphQLScalarType) {
        if (existingValue) return existingValue
        if (resolvedFieldMock) return resolvedFieldMock

        const scalarTypeMock = mocks[fieldTypeName]

        if (!scalarTypeMock) {
          throw new Error(`No mock provided for scalar type "${fieldTypeName}", path: ${path.join('.')}`)
        }

        return typeof scalarTypeMock === 'function'
          ? scalarTypeMock(root, args, restContext, info)
          : scalarTypeMock
      }

      if (fieldType instanceof GraphQLEnumType) {
        if (existingValue) return existingValue
        if (resolvedFieldMock) return resolvedFieldMock

        if (!resolvedFieldMock) {
          // TODO: resolve mock
          // if value is not provided - pick first value from the enum
        }

        return resolvedTypeMock
      }

      if (fieldType instanceof GraphQLList) {
        if (resolvedFieldMock) {
          return existingValue ? merge([], resolvedFieldMock, existingValue) : resolvedFieldMock
        }

        return resolvedFieldMock === undefined ? [{}, {}] : resolvedFieldMock
      }

      if (fieldType instanceof GraphQLObjectType) {
        if (resolvedFieldMock) {
          return existingValue ? merge({}, resolvedFieldMock, existingValue) : resolvedFieldMock
        }

        return resolvedFieldMock === undefined ? {} : resolvedFieldMock
      }

      if (fieldType instanceof GraphQLUnionType || fieldType instanceof GraphQLInterfaceType) {
        // todo - implement this one
      }

      throw new Error(`Unexpected parent type "${typeName}" of ${path.join('.')}`)
    }
  })
}

export { mockFields }
