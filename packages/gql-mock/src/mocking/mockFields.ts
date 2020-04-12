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
  GraphQLResolveInfo,
} from 'graphql'
import { forEachField } from 'graphql-tools'
import merge from 'lodash.merge'

export const MAGIC_CONTEXT_MOCKS = '__MOCKS-2ba176b7-1636-4cc8-a9cd-f0dcf9c09761'

export type ResolvedTypeMock = { [key in any]: unknown }
export interface CacheMap {
  [key: string]: undefined | ResolvedTypeMock
}

export interface MockOptions {
  cache: CacheMap
  mocks: { [key: string]: unknown }
}

export interface MockFieldsOptions {
  schema: GraphQLSchema
}

export type MockingContext = { [key in typeof MAGIC_CONTEXT_MOCKS]: MockOptions } & { [key in any]: unknown }

interface MockingData {
  root: {}
  args: { [argName: string]: unknown }
  context: MockingContext
  info: GraphQLResolveInfo
  mocking: MockOptions
}

/**
 * @description
 * Caching is necessary here as we want that each type mock resolver would be
 * invoked only once per single resolved type.
 *
 * @explanation
 * Because we are placing mocks on the fields and each type can contain multiple fields,
 * mock for the type can be invoked multiple times, E.g. for query:
 *
 *     Comment {
 *       id
 *       name
 *     }
 *
 * in this case we would resolve Comment mock twice,
 * firs time to resolve id field, second time to resolve name field.
 * However, we want that Comment mock would be invoked once here.
 *
 * NOTE: However, if the type is used in different places of the query,
 *  e.g. array, or different field, then we want that it would be invoked again.
 *
 * As a nice side effect, we can expect performance improvements
 * but that is not the main goal of this function.
 */
const getCached = <T extends undefined | ResolvedTypeMock>(
  cache: CacheMap,
  info: GraphQLResolveInfo,
  resolve: () => T
): T => {
  const path = responsePathAsArray(info.path)
  const cacheKey = [
    info.operation.operation + info.operation.loc?.start,
    ...path.slice(0, path.length - 1),
  ].join('.')

  if (cacheKey in cache) {
    return cache[cacheKey] as T
  }
  const resolved = resolve()
  cache[cacheKey] = resolved
  return resolved
}

// Basically redefine GraphQLFieldResolver with stricter parameters
type ResolveFn = (
  source: {},
  args: { [argName: string]: unknown },
  context: { [key in typeof MAGIC_CONTEXT_MOCKS]: MockOptions } & { [key in any]: unknown },
  info: GraphQLResolveInfo
) => null | string | boolean | number | {} | any[]

function mockFields({ schema }: MockFieldsOptions): void {
  if (!schema) {
    throw new Error('Must provide schema to mock')
  }
  if (!(schema instanceof GraphQLSchema)) {
    throw new Error('Value at "schema" must be of type GraphQLSchema')
  }

  forEachField(schema, (field: GraphQLField<any, any>, parentTypeName: string) => {
    const oldResolver = field.resolve
    const newResolver: ResolveFn = (root, args, context, info) => {
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

      const { [MAGIC_CONTEXT_MOCKS]: options, ...restContext } = context || {}
      const { cache, mocks } = options

      // TODO - figure it out what to do with existing resolvers
      const previousResolvers = oldResolver ? [oldResolver] : []

      const parentTypeMockFn = mocks[parentTypeName]
      const resolvedTypeMock = getCached(cache, info, () =>
        typeof parentTypeMockFn === 'function'
          ? parentTypeMockFn(root, args, restContext, info)
          : parentTypeMockFn
      )

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

      throw new Error(`Unexpected parent type "${parentTypeName}" of ${path.join('.')}`)
    }

    field.resolve = newResolver
  })
}

export { mockFields }
