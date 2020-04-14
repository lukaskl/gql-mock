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

// // TODO: remove this type
export type ResolvableValue<Context, T> =
  | ((root: unknown, args: {}, context: Context, info: GraphQLResolveInfo) => T)
  | T

export type NaiveIntrospectionResult = { __schema: any }
export type SchemaInput = NaiveIntrospectionResult | string | GraphQLSchema
