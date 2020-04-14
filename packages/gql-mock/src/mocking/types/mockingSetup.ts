import { DocumentNode, GraphQLResolveInfo } from 'graphql'
import { DeepPartial, OptionalArray, PickIfExists, RequireIfNotEmpty } from '~/utils'

import { OperationKind, PossibleResolvedValued, ResolvableValue } from './graphql.types'

export type AnyOperationMap = {
  operationType: {}
  variablesType: {}
  typeUsages: any
  kind: OperationKind
}

export type MockResolverFn<Root extends {}, Args extends {}, Return, Context = {}> = (
  root: Root,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Return

export type FieldMock<Root extends {}, Args extends {}, Return, Context = {}> =
  | Return
  | MockResolverFn<Root, Args, Return, Context>
  | undefined

export type TypeMocks = { [key: string]: FieldMock<{}, {}, PossibleResolvedValued, {}> | undefined }

/**
 * Union of string literals of operation names
 * @example
 * 'getComments' | 'updateComment'
 */
export type OperationKeys<
  TypesMap extends { operations: { [key in keyof TypesMap['operations']]: AnyOperationMap } }
> = keyof TypesMap['operations']

export type UsageTypes<
  TypesMap extends { operations: { [key in keyof TypesMap['operations']]: AnyOperationMap } },
  Operation extends OperationKeys<TypesMap>
> = TypesMap['operations'][Operation]['typeUsages']

export type UsageType<
  TypesMap extends { operations: { [key in keyof TypesMap['operations']]: AnyOperationMap } },
  Operation extends OperationKeys<TypesMap>,
  Type extends keyof UsageTypes<TypesMap, Operation>
> = UsageTypes<TypesMap, Operation>[Type]

export type Variables<
  TypesMap extends { operations: { [key in keyof TypesMap['operations']]: AnyOperationMap } },
  Operation extends OperationKeys<TypesMap>
> = TypesMap['operations'][Operation]['variablesType']

export type OperationResult<
  TypesMap extends { operations: { [key in keyof TypesMap['operations']]: AnyOperationMap } },
  Operation extends OperationKeys<TypesMap>
> = TypesMap['operations'][Operation]['operationType']

export type TypeArgsMap<TypesMap extends { fieldArgsUsages: {} }, Type extends PropertyKey> = PickIfExists<
  TypesMap['fieldArgsUsages'],
  Type
>

export type ScopedMockResolvers<
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
  },
  Operation extends OperationKeys<TypesMap>,
  Context = {}
> = {
  [Type in keyof UsageTypes<TypesMap, Operation>]?: ResolvableValue<
    Context,
    MockFields<UsageType<TypesMap, Operation, Type>, TypeArgsMap<TypesMap, Type>, Context>
  >
}

export type AllTypesMocks<
  TypesMap extends {
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Context = {}
> = {
  [Type in keyof TypesMap['allOutputTypes']]?: ResolvableValue<
    Context,
    MockFields<TypesMap['allOutputTypes'][Type], PickIfExists<TypesMap['fieldArgsUsages'], Type>, Context>
  >
} &
  {
    [Type in keyof TypesMap['allScalarTypes']]?: FieldMock<{}, {}, TypesMap['allScalarTypes'][Type], Context>
  }

export interface BuildMockingConfig<
  TypesMap extends {
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Context = {}
> {
  mocks?: OptionalArray<AllTypesMocks<TypesMap>>
  context?: Context
}

export type UserMocksInput<
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Operation extends OperationKeys<TypesMap>
> = OptionalArray<ScopedMockResolvers<TypesMap, Operation> | (() => AllTypesMocks<TypesMap>)>

export type OperationMockOptions<
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Operation extends OperationKeys<TypesMap>
> = {
  mocks?: UserMocksInput<TypesMap, Operation>
} & RequireIfNotEmpty<'variables', Variables<TypesMap, Operation>>

export type MockFields<Type extends {}, ArgsMap extends {}, Context = {}> = {
  [Field in keyof Type]?: FieldMock<
    DeepPartial<Type>,
    PickIfExists<ArgsMap, Field>,
    DeepPartial<Type[Field]>,
    Context
  >
}
export type DocumentsMap<T extends PropertyKey> = {
  [name in T]: { document: DocumentNode; kind: OperationKind }
}
