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
  GraphQLNullableType,
} from 'graphql'
import { forEachField } from 'graphql-tools'
import mergeRaw from 'lodash.merge'
import { PossibleResolvedValued, ResolveFn, Resolvable, MergingStrategy, BaseMockOptions } from './types'
import flatMap from 'lodash.flatmap'

export const MAGIC_CONTEXT_MOCKS = '__MOCKS-2ba176b7-1636-4cc8-a9cd-f0dcf9c09761'

const merge = (...args: PossibleResolvedValued[]): PossibleResolvedValued => {
  const objs = args.map(x => ({ temp: x }))
  return (mergeRaw as any)(...objs).temp
}

export interface CacheMap {
  [key: string]: PossibleResolvedValued
}

type TypeMockResolvers = {
  [key: string]: undefined | PossibleResolvedValued | ResolveFn
}
type TypeMock = { resolvers: TypeMockResolvers; preservePrevious: boolean }

export interface FieldMockOptions {
  cache: CacheMap
  mocks: TypeMock[]
  mergingStrategy: MergingStrategy
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
  path: (string | number)[],
  resolve: () => PossibleResolvedValued
): PossibleResolvedValued => {
  const cacheKey = path.join('.')

  if (cacheKey in cache) {
    return cache[cacheKey]
  }
  const resolved = resolve()
  cache[cacheKey] = resolved
  return resolved
}

const getTypeMockResolver = (
  mockOptions: FieldMockOptions,
  cacheKey: (string | number)[],
  forType: string,
  interfaceTypes: string[] = [],
  takeFirstResolvedOnly = false
): ResolveFn => {
  const { cache, mocks } = mockOptions

  const matchingTypes = [forType, ...interfaceTypes]
  // collect all mocks which applies to this
  const matchingTypeMocks = flatMap(mocks, mock => {
    const mockKeys = Object.keys(mock.resolvers).filter(type => matchingTypes.includes(type)) as string[]

    const { preservePrevious } = mock
    return mockKeys.map(type => ({ type, resolver: mock.resolvers[type], preservePrevious }))
  }).reverse()

  const normalizedResolver: ResolveFn = (...args) => {
    const resolve = <T extends PossibleResolvedValued>(fnOrObj: Resolvable<T>) =>
      typeof fnOrObj === 'function' ? fnOrObj(...args) : fnOrObj

    let returnValue: PossibleResolvedValued = undefined

    for (const mock of matchingTypeMocks) {
      const value = resolve(mock.resolver)
      if (value === undefined) {
        continue
      }
      if (returnValue === undefined) {
        returnValue = value
        continue
      }
      if (takeFirstResolvedOnly) {
        break
      }
      if (mock.preservePrevious === false && !interfaceTypes.includes(mock.type)) {
        break
      }
      returnValue = merge(undefined, value, returnValue)
    }

    return returnValue
  }

  const cachedResolver: ResolveFn<PossibleResolvedValued> = (...args) =>
    getCached(cache, [...cacheKey, forType], () => normalizedResolver(...args))

  return cachedResolver
}

const isValidAbstract = (item: PossibleResolvedValued) =>
  typeof item === 'object' && item && !!(item as { [key: string]: any })['__typename']

const guardItemType = (
  item: Exclude<PossibleResolvedValued, null | undefined>,
  itemType: GraphQLNullableType,
  path: (string | number)[]
) => {
  if (itemType instanceof GraphQLList && !Array.isArray(item)) {
    throw new Error(`expected item of list type at path ${path.join('.')}, found ${JSON.stringify(item)}`)
  }
  if (
    itemType instanceof GraphQLObjectType ||
    itemType instanceof GraphQLUnionType ||
    itemType instanceof GraphQLInterfaceType
  ) {
    if (typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`expected item of object type at path ${path.join('.')}, found ${JSON.stringify(item)}`)
    }
  }

  if (itemType instanceof GraphQLEnumType && typeof item !== 'string') {
    throw new Error(`expected item of string type at path ${path.join('.')}, found ${JSON.stringify(item)}`)
  }

  // we shouldn't validate scalars, as scalar can be nearly everything what user defines.
}

interface ResolveTypeParams<Context extends {} = { [key in any]: unknown }> {
  type: GraphQLNullableType
  existingValue: PossibleResolvedValued
  resolvableValue: Resolvable<PossibleResolvedValued, Context>
  resolve: <T extends PossibleResolvedValued>(resolvable: Resolvable<T, Context>) => T | undefined
  path: (string | number)[]
  getResolver: (
    forType: string,
    cacheKey: (string | number)[],
    interfaceTypes?: string[],
    takeFirstResolvedOnly?: boolean
  ) => ResolveFn<PossibleResolvedValued>
  onUnexpectedType: (type: GraphQLNullableType, path: (string | number)[]) => never
  config: BaseMockOptions
}
const resolveType = <Context extends {} = { [key in any]: unknown }>(
  params: ResolveTypeParams<Context>
): Exclude<PossibleResolvedValued, undefined> => {
  const { type, existingValue, resolvableValue, resolve, path, getResolver, onUnexpectedType } = params

  const typeName = getNamedType(type).name

  const getMergedValue = (): PossibleResolvedValued => {
    const { mergingStrategy } = params.config
    if (mergingStrategy === 'preserve-deeper') {
      if (existingValue !== undefined && type instanceof GraphQLScalarType) {
        return existingValue
      }
      return merge(undefined, resolve(resolvableValue), existingValue)
    }
    if (mergingStrategy === 'preserve-shallow') {
      const resolved = resolve(resolvableValue)
      if (resolved !== undefined && type instanceof GraphQLScalarType) {
        return resolved
      }
      return merge(undefined, existingValue, resolved)
    }
    throw new Error(`unexpected merging strategy received: "${mergingStrategy}"`)
  }
  const mergedValue = getMergedValue()

  if (type instanceof GraphQLScalarType) {
    if (mergedValue !== undefined) return mergedValue

    const resolvableScalar = getResolver(typeName, path, [], true)

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
    if (mergedValue !== undefined) return mergedValue

    const resolvableEnum = getResolver(typeName, path, [], true)

    const result = resolve(resolvableEnum)
    if (result === undefined) {
      const firstValue = type.getValues()[0]?.name
      if (firstValue === undefined) {
        throw new Error(`Something is wrong with the enum "${type.inspect()}", couldn't get values`)
      }
      return firstValue
    }

    return result
  }

  if (type instanceof GraphQLList) {
    const itemType = type.ofType
    const fallbackItemValue = (position: number, existingItem: PossibleResolvedValued = undefined) => {
      if (itemType instanceof GraphQLObjectType) {
        return {}
      }
      if (
        itemType instanceof GraphQLUnionType ||
        itemType instanceof GraphQLInterfaceType ||
        itemType instanceof GraphQLEnumType ||
        itemType instanceof GraphQLScalarType ||
        itemType instanceof GraphQLList
      ) {
        return resolveType({
          ...params,
          type: itemType,
          existingValue: existingItem,
          resolvableValue: undefined,
          path: [...path, position],
        })
      }

      return onUnexpectedType(itemType, [...path, position])
    }
    const fallbackValue = () => [fallbackItemValue(0), fallbackItemValue(1)]
    const shouldFallback = (position: number, item: PossibleResolvedValued) => {
      if (item === undefined) return true
      if (item === null) return false
      guardItemType(item, itemType, [...path, position])
      if (itemType instanceof GraphQLList) return true

      if (
        (itemType instanceof GraphQLUnionType || itemType instanceof GraphQLInterfaceType) &&
        !isValidAbstract(item)
      ) {
        return true
      }
      return false
    }

    return mergedValue === undefined
      ? fallbackValue()
      : (mergedValue as any[]).map((x, i) => (shouldFallback(i, x) ? fallbackItemValue(i, x) : x))
  }

  if (type instanceof GraphQLObjectType) {
    if (mergedValue !== undefined) return mergedValue
    return {} // fallback value of object type
  }

  if (type instanceof GraphQLUnionType || type instanceof GraphQLInterfaceType) {
    const resolvableAbstract = getResolver(typeName, path, [], true)
    const result = merge(undefined, resolve(resolvableAbstract), mergedValue)
    if (result === undefined || !isValidAbstract(result)) {
      throw new Error(
        `A mock providing "__typename" property for type ${typeName} is required, error at ${path.join('.')}`
      )
    }

    return result
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
        mocks: [{ resolvers: { [parentTypeName]: oldResolver }, preservePrevious: false }, ...options.mocks],
      }

      const resolve = <T extends PossibleResolvedValued>(fnOrObj: Resolvable<T>): T | undefined =>
        typeof fnOrObj === 'function' ? fnOrObj(root, args, restContext, info) : fnOrObj

      const getTypeResolver = (
        forType: string,
        cacheKey: (string | number)[],
        interfaces: string[] = [],
        takeFirstResolvedOnly = false
      ) => getTypeMockResolver(augmentedMocks, cacheKey, forType, interfaces, takeFirstResolvedOnly)

      const resolverFn = getTypeResolver(
        parentTypeName,
        path.slice(0, path.length - 1),
        fieldType instanceof GraphQLObjectType ? fieldType.getInterfaces().map(x => x.name) : []
      )

      /**
       * We know that this must be an object, because we are in type resolver trying to resolve a field
       * and that can happen only if the parent is an object
       */
      const resolvedTypeMock = resolve(resolverFn) as { [key in any]: unknown }
      const resolvableField = (resolvedTypeMock || {})[fieldName] as Resolvable<PossibleResolvedValued>

      return resolveType({
        existingValue,
        resolve,
        path,
        type: fieldType,
        resolvableValue: resolvableField,
        getResolver: getTypeResolver,
        onUnexpectedType: (type, path) => {
          throw new Error(
            `Unexpected GraphQL type "${
              type?.constructor.name
            }" of "${parentTypeName}.${fieldName}" at ${path.join('.')}`
          )
        },
        config: options,
      })
    }

    field.resolve = newResolver
  })
}

export { mockFields }
