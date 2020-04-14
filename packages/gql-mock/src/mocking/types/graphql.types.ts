import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'

export type OperationKind = 'mutation' | 'query' | 'subscription' | 'fragment'

export type PossibleResolvedValued =
  | undefined
  | null
  | boolean // Type can be a scalar
  | number // Type can be a scalar
  | string // Type can be a scalar or an enum
  | { [key in any]: unknown }
  | any[]

export type NaiveIntrospectionResult = { __schema: any }
export type SchemaInput = NaiveIntrospectionResult | string | GraphQLSchema

export type ResolveFn<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = { [key in any]: unknown }
> = (source: unknown, args: { [argName: string]: unknown }, context: Context, info: GraphQLResolveInfo) => T

export type Resolvable<
  T extends PossibleResolvedValued = PossibleResolvedValued,
  Context extends {} = { [key in any]: unknown }
> = T | ResolveFn<T, Context>
