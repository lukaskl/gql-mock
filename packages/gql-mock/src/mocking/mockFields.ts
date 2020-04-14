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
  GraphQLNullableType,
} from 'graphql'
import { forEachField } from 'graphql-tools'
import merge from 'lodash.merge'
import { PossibleResolvedValued } from './types'

export const MAGIC_CONTEXT_MOCKS = '__MOCKS-2ba176b7-1636-4cc8-a9cd-f0dcf9c09761'

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

export interface FieldMockOptions {
  cache: CacheMap
  mocks: TypeMock[]
}

export interface MockFieldsOptions {
  schema: GraphQLSchema
}

export type MagicContext = { [key in typeof MAGIC_CONTEXT_MOCKS]: FieldMockOptions } &
  { [key in any]: unknown }

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
  typeName: string,
  resolve: () => undefined | PossibleResolvedValued
): undefined | PossibleResolvedValued => {
  const path = responsePathAsArray(info.path)
  const cacheKey = [
    info.operation.operation + info.operation.loc?.start,
    ...path.slice(0, path.length - 1),
    typeName,
  ].join('.')

  if (cacheKey in cache) {
    return cache[cacheKey]
  }
  const resolved = resolve()
  cache[cacheKey] = resolved
  return resolved
}

const getTypeMockResolver = <T extends PossibleResolvedValued>(
  mockOptions: FieldMockOptions,
  info: GraphQLResolveInfo,
  forType: string,
  interfaceTypes: string[] = [],
  takeFirstResolverOnly = false
): Resolvable<T> => {
  const { cache } = mockOptions
  throw new Error('not implemented')
}

interface ResolveTypeParams<Context extends {} = { [key in any]: unknown }> {
  type: GraphQLNullableType
  existingValue: PossibleResolvedValued
  resolvableValue: Resolvable<PossibleResolvedValued, Context>
  resolve: <T extends PossibleResolvedValued>(resolvable: Resolvable<T, Context>) => T | undefined
  path: (string | number)[]
  getResolver: <T extends PossibleResolvedValued>(
    forType: string,
    interfaceTypes?: string[],
    takeFirstResolverOnly?: boolean
  ) => Resolvable<T>
  onUnexpectedType: (type: GraphQLNullableType, path: (string | number)[]) => never
}
const resolveType = <Context extends {} = { [key in any]: unknown }>(
  params: ResolveTypeParams<Context>
): Exclude<PossibleResolvedValued, undefined> => {
  const { type, existingValue, resolvableValue, resolve, path, getResolver, onUnexpectedType } = params

  const typeName = getNamedType(type).name

  if (type instanceof GraphQLScalarType) {
    if (existingValue !== undefined) return existingValue
    if (resolvableValue) {
      const result = resolve(resolvableValue)
      if (result !== undefined) return result
    }

    // TODO: indicate it is scalar
    // by doing so we can short-circuit resolvers merging
    // as we know that only the last one will "win"
    const resolvableScalar = getResolver(typeName, [], true)

    if (!resolvableScalar) {
      throw new Error(`No mock provided for scalar type "${typeName}" at path: ${path.join('.')}`)
    }

    const result = resolve(resolvableScalar)

    if (result === undefined) {
      throw new Error(
        `Mock for scalar type "${typeName}" was provided but returned undefined at path: ${path.join('.')}`
      )
    }

    return result
  }

  if (type instanceof GraphQLEnumType) {
    if (existingValue !== undefined) return existingValue
    if (resolvableValue) {
      const result = resolve(resolvableValue)
      if (result !== undefined) return result
    }

    const resolvableEnum = getResolver(typeName, [], true)

    const result = resolve(resolvableEnum)
    if (result === undefined) {
      if (true as any) {
        throw new Error('not implemented - validate enum behavior')
      }

      const firstValue = type.getValues()[0]?.name
      if (firstValue === undefined) {
        throw new Error(`Something is wrong with the enum "${type.inspect()}", couldn't get values`)
      }
      return firstValue
    }

    return result
  }

  if (type instanceof GraphQLList) {
    const itemType = getNamedType(type)
    const fallbackItemValue = (position: number) => {
      if (
        itemType instanceof GraphQLUnionType ||
        itemType instanceof GraphQLInterfaceType ||
        itemType instanceof GraphQLObjectType
      ) {
        return {}
      }
      if (itemType instanceof GraphQLEnumType || itemType instanceof GraphQLScalarType) {
        // TODO: recursively resolve enums and scalars
        // throw new Error('not implemented - resolve scalars within the list')
        return resolveType({
          ...params,
          type: itemType,
          existingValue: undefined,
          resolvableValue: undefined,
          path: [...path, position],
        })
      }

      return onUnexpectedType(itemType, [...path, position])
    }
    const fallbackValue = () => [fallbackItemValue(0), fallbackItemValue(1)]

    if (resolvableValue) {
      const result: any[] | undefined = existingValue
        ? merge([], resolve(resolvableValue), existingValue)
        : resolve(resolvableValue as Resolvable<any[], Context>)

      return result === undefined
        ? fallbackValue()
        : result.map((x, i) => (x === undefined ? fallbackItemValue(i) : x))
    }

    return resolvableValue === undefined ? fallbackValue() : resolvableValue
  }

  if (type instanceof GraphQLObjectType) {
    const fallbackValue = {}
    if (resolvableValue) {
      const result = existingValue
        ? merge({}, resolve(resolvableValue), existingValue)
        : resolve(resolvableValue)
      return result === undefined ? fallbackValue : result
    }

    return resolvableValue === undefined ? fallbackValue : resolvableValue
  }

  if (type instanceof GraphQLUnionType || type instanceof GraphQLInterfaceType) {
    // todo - implement this one
    return { __typename: 'User' }
  }

  return onUnexpectedType(type, path)
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
      // if it is - should we throw an error?
      const existingValue = ((root as any) || {})[fieldName] as PossibleResolvedValued

      const { [MAGIC_CONTEXT_MOCKS]: options, ...restContext } = context || {}

      const augmentedMocks: FieldMockOptions = {
        ...options,
        mocks: [{ preservePrevious: false, resolvers: { [parentTypeName]: oldResolver } }, ...options.mocks],
      }

      const resolvableValue = getTypeMockResolver(
        augmentedMocks,
        info,
        parentTypeName,
        fieldType instanceof GraphQLObjectType ? fieldType.getInterfaces().map(x => x.name) : []
      )

      const resolve = <T extends PossibleResolvedValued>(fnOrObj: Resolvable<T>): T | undefined =>
        typeof fnOrObj === 'function' ? fnOrObj(root, args, restContext, info) : fnOrObj

      /**
       * We know that this must be an object, because we are in type resolver trying to resolve a field
       * and that can happen only if the parent is an object
       */
      const resolvedTypeMock = resolve(resolvableValue) as { [key in any]: unknown }
      const resolvableField = (resolvedTypeMock || {})[fieldName] as Resolvable<PossibleResolvedValued>

      return resolveType({
        existingValue,
        resolve,
        path,
        type: fieldType,
        resolvableValue: resolvableField,
        getResolver: (forType, interfaces = [], takeFirstResolverOnly = false) =>
          getTypeMockResolver(augmentedMocks, info, forType, interfaces, takeFirstResolverOnly),
        onUnexpectedType: (type, path) => {
          throw new Error(
            `Unexpected GraphQL type "${
              type?.constructor.name
            }" of "${parentTypeName}.${fieldName}" at ${path.join('.')}`
          )
        },
      })
    }

    field.resolve = newResolver
  })
}

export { mockFields }
