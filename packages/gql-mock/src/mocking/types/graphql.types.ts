import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { UnknownKeysObj } from '~/utils'

export type OperationKind = 'mutation' | 'query' | 'subscription' | 'fragment'

export type PossibleResolvedValued =
  | undefined
  | null
  | boolean // Type can be a scalar
  | number // Type can be a scalar
  | string // Type can be a scalar or an enum
  | UnknownKeysObj
  | any[]

export type NaiveIntrospectionResult = { __schema: any }
export type SchemaInput = NaiveIntrospectionResult | string | GraphQLSchema

export type ResolveFn<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = UnknownKeysObj
> = (source: UnknownKeysObj, args: UnknownKeysObj, context: Context, info: GraphQLResolveInfo) => T

export type Resolvable<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = UnknownKeysObj
> = T | ResolveFn<T, Context>
