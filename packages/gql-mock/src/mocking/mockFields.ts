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

export type PossibleResolvedValued =
  | undefined
  | null
  | boolean // Type can be a scalar
  | number // Type can be a scalar
  | string // Type can be a scalar or an enum
  | { [key in any]: unknown }
  | any[]

export interface CacheMap {
  [key: string]: PossibleResolvedValued
}

type ResolveFn<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = { [key in any]: unknown }
> = (source: unknown, args: { [argName: string]: unknown }, context: Context, info: GraphQLResolveInfo) => T

type Resolvable<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = { [key in any]: unknown }
> = T | ResolveFn<T, Context>

type TypeMockResolvers = {
  [key: string]: undefined | PossibleResolvedValued | ResolveFn
}
type TypeMock = { resolvers: TypeMockResolvers; preservePrevious: boolean }

export interface MockOptions {
  cache: CacheMap
  mocks: TypeMock[]
}

export interface MockFieldsOptions {
  schema: GraphQLSchema
}

export type MockingContext = { [key in typeof MAGIC_CONTEXT_MOCKS]: MockOptions } & { [key in any]: unknown }

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
const getCached = (
  cache: CacheMap,
  info: GraphQLResolveInfo,
  resolve: () => undefined | PossibleResolvedValued
): undefined | PossibleResolvedValued => {
  const path = responsePathAsArray(info.path)
  const cacheKey = [
    info.operation.operation + info.operation.loc?.start,
    ...path.slice(0, path.length - 1),
  ].join('.')

  if (cacheKey in cache) {
    return cache[cacheKey]
  }
  const resolved = resolve()
  cache[cacheKey] = resolved
  return resolved
}

type MagicContext = { [key in typeof MAGIC_CONTEXT_MOCKS]: MockOptions } & { [key in any]: unknown }

const getTypeMockResolver = <T extends PossibleResolvedValued>(
  mockOptions: MockOptions,
  info: GraphQLResolveInfo,
  forType: string,
  interfaceTypes: string[] = []
): Resolvable<T> => {
  const { cache } = mockOptions
  throw new Error('not implemented')
}

function mockFields({ schema }: MockFieldsOptions): void {
  if (!schema) {
    throw new Error('Must provide schema to mock')
  }
  if (!(schema instanceof GraphQLSchema)) {
    throw new Error('Value at "schema" must be of type GraphQLSchema')
  }

  forEachField(schema, (field: GraphQLField<any, any>, parentTypeName: string) => {
    const oldResolver = field.resolve

    const newResolver: ResolveFn<Exclude<PossibleResolvedValued, undefined>, MagicContext> = (
      root,
      args,
      context,
      info
    ) => {
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

      // TODO: can this value be a resolver function? E.g. passed by deeply nesting
      const existingValue = ((root as any) || {})[fieldName] as PossibleResolvedValued

      const { [MAGIC_CONTEXT_MOCKS]: options, ...restContext } = context || {}

      const augmentedMocks: MockOptions = {
        ...options,
        mocks: [{ preservePrevious: false, resolvers: { [parentTypeName]: oldResolver } }, ...options.mocks],
      }

      const resolvableValue = getTypeMockResolver(
        augmentedMocks,
        info,
        parentTypeName
        // TODO: collect and pass typenames of all possible interfaces
      )

      const resolve = <T extends PossibleResolvedValued>(fnOrObj: Resolvable<T>): T | undefined =>
        typeof fnOrObj === 'function' ? fnOrObj(root, args, restContext, info) : fnOrObj

      const resolvedTypeMock = resolve(resolvableValue)

      // TODO: type this const
      const resolvableField = ((resolvedTypeMock as any) || {})[fieldName] as Resolvable<
        PossibleResolvedValued
      >

      // TODO - split this whole function by type
      if (fieldType instanceof GraphQLScalarType) {
        if (existingValue !== undefined) return existingValue
        if (resolvableField) {
          const result = resolve(resolvableField)
          if (result !== undefined) return result
        }

        // TODO: indicate it is scalar
        // by doing so we can short-circuit resolvers merging
        // as we know that only the last one will "win"
        const resolvableScalar = getTypeMockResolver(augmentedMocks, info, fieldTypeName)

        if (!resolvableScalar) {
          throw new Error(`No mock provided for scalar type "${fieldTypeName}" at path: ${path.join('.')}`)
        }

        const result = resolve(resolvableScalar)

        if (result === undefined) {
          throw new Error(
            `Mock for scalar type "${fieldTypeName}" was provided but returned undefined at path: ${path.join(
              '.'
            )}`
          )
        }

        return result
      }

      if (fieldType instanceof GraphQLEnumType) {
        if (existingValue !== undefined) return existingValue
        if (resolvableField) {
          const result = resolve(resolvableField)
          if (result !== undefined) return result
        }

        if (!resolvableField) {
          // TODO: resolve mock
          // if value is not provided - pick first value from the enum
          throw new Error('not implemented')
        }

        throw new Error('not implemented')
        // return resolvedTypeMock
      }

      if (fieldType instanceof GraphQLList) {
        // TODO: validate or fix default fallback value for items
        // {} makes sense for the list of objects,
        // however, it can be a list of enums, scalars
        const fallbackItemValue = () => ({})
        const fallbackValue = () => [fallbackItemValue(), fallbackItemValue()]

        if (resolvableField) {
          const result: any[] | undefined = existingValue
            ? merge([], resolve(resolvableField), existingValue)
            : resolve(resolvableField as Resolvable<any[]>)
          // TODO: write tests for this part
          // what happens if fieldMock returns null / undefined / any other value
          return result === undefined
            ? fallbackValue()
            : result.map(x => (x === undefined ? fallbackItemValue() : x))
        }

        return resolvableField === undefined ? fallbackValue() : resolvableField
      }

      if (fieldType instanceof GraphQLObjectType) {
        const fallbackValue = {}
        if (resolvableField) {
          const result = existingValue
            ? merge({}, resolve(resolvableField), existingValue)
            : resolve(resolvableField)
          return result === undefined ? fallbackValue : result
        }

        return resolvableField === undefined ? fallbackValue : resolvableField
      }

      if (fieldType instanceof GraphQLUnionType || fieldType instanceof GraphQLInterfaceType) {
        // todo - implement this one
        return { __typename: 'User' }
      }

      throw new Error(
        `Unexpected GraphQL type "${
          fieldType?.constructor.name
        }" of "${parentTypeName}.${fieldName}" at ${path.join('.')}`
      )
    }

    field.resolve = newResolver
  })
}

export { mockFields }
