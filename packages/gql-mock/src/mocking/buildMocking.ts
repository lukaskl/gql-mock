import {
  GraphQLSchema,
  buildClientSchema,
  graphqlSync,
  print,
  visit,
  DocumentNode,
  SelectionSetNode,
  ExecutionResult,
  buildSchema,
  GraphQLResolveInfo,
} from 'graphql'
import {
  MAGIC_CONTEXT_MOCKS,
  mockFields,
  MagicContext,
  FieldMockOptions,
  PossibleResolvedValued,
} from './mockFields'

import * as uuid from 'uuid'
import { DeepPartial } from './types'

export type NaiveIntrospectionResult = { __schema: any }
export type SchemaInput = NaiveIntrospectionResult | string | GraphQLSchema

const isIntrospectionQuery = (input: SchemaInput): input is NaiveIntrospectionResult =>
  !!(input as { __schema: any }).__schema

const getSchema = (input: SchemaInput): GraphQLSchema => {
  // TODO: extend the schema adding arbitrary
  // node (generated on runtime)
  // which will be used to resolve Fragments

  if (typeof input === 'string') {
    return buildSchema(input)
  }

  if (isIntrospectionQuery(input)) {
    return buildClientSchema(input)
  }

  if (input instanceof GraphQLSchema) {
    return input
  }

  throw new Error(
    `Schema must be one of: GraphQLSchema object, JSON of introspection query result, string of GraphQL SDL, found: ${input}`
  )
}

function addTypenames(document: DocumentNode): DocumentNode {
  return visit(document, {
    SelectionSet: {
      leave: node => {
        const selections = node.selections
        const typenameFieldExists = selections.find(x => x.kind === 'Field' && x.name.value === '__typename')

        if (!typenameFieldExists) {
          const result: SelectionSetNode = {
            ...node,
            selections: [...selections, { kind: 'Field', name: { kind: 'Name', value: '__typename' } }],
          }
          return result
        }
      },
    },
  })
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

// type NormalizedMocks = IMocks

// const mergeMocks = (mocks: TypeMocks[]): NormalizedMocks => {
//   const mocksMap: { [typeName: string]: TypeMock<{}>[] } = {}

//   for (const mock of mocks) {
//     for (const [typeName, typeMock] of Object.entries(mock)) {
//       if (!mocksMap[typeName]) {
//         mocksMap[typeName] = []
//       }
//       mocksMap[typeName].push(typeMock)
//     }
//   }

//   const mergedMocks = Object.keys(mocksMap).map(typeName => {
//     const resolver: GraphQLFieldResolver<unknown, unknown> = (source, args, context, info) => {
//       const typeMocks = mocksMap[typeName]
//       const reducedMock = typeMocks.reduce(
//         (l, r) => ({ ...l, ...(typeof r === 'function' ? (r as any)(source, args, context, info) : r) }),
//         {}
//       )
//       return reducedMock
//     }
//     return { [typeName]: resolver }
//   })
//   return mergedMocks.reduce((l, r) => ({ ...l, ...r }), {})
// }

type PickIfExists<
  Type extends {},
  Key extends string | number | symbol,
  Default = {}
> = Key extends keyof Type ? Type[Key] : Default

type MockFields<Type extends {}, ArgsMap extends {}, Context = {}> = {
  [Field in keyof Type]?: FieldMock<
    DeepPartial<Type>,
    PickIfExists<ArgsMap, Field>,
    DeepPartial<Type[Field]>,
    Context
  >
}

type OperationKind = 'mutation' | 'query' | 'subscription' | 'fragment'
type DocumentsMap<T extends PropertyKey> = { [name in T]: { document: DocumentNode; kind: OperationKind } }

type RequireIfNotEmpty<PropName extends PropertyKey, T> = {} extends T
  ? { [key in PropName]?: T }
  : { [key in PropName]: T }

type AnyOperationMap = {
  operationType: {}
  variablesType: {}
  typeUsages: any
  kind: OperationKind
}

type OptionalSpread<T> = {} extends T ? [] | [T] : [T]

const defaultMocks: TypeMocks = {
  Int: () => Math.round(Math.random() * 200) - 100,
  Float: () => Math.random() * 200 - 100,
  String: 'Hello World',
  Boolean: () => Math.random() > 0.5,
  ID: () => uuid.v4(),
}

// // TODO: remove this type
export type ResolvableValue<Context, T> =
  | ((root: unknown, args: {}, context: Context, info: GraphQLResolveInfo) => T)
  | T

export type AllTypesMocks<
  AllTypes extends {},
  AllScalars extends {},
  ArgsMap extends {},
  Context extends {}
> = {
  [Type in keyof AllTypes]?: ResolvableValue<
    Context,
    MockFields<AllTypes[Type], PickIfExists<ArgsMap, Type>, Context>
  >
} &
  {
    [Type in keyof AllScalars]?: FieldMock<{}, {}, AllScalars[Type], Context>
  }

export interface BuildMockingConfig<
  AllTypes extends {},
  AllScalars extends {},
  ArgsMap extends {},
  Context extends {}
> {
  mocks?: AllTypesMocks<AllTypes, AllScalars, ArgsMap, Context>
  context?: Context
}

export const buildMocking = <
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Context = {},
  Documents extends DocumentsMap<keyof TypesMap['operations']> = DocumentsMap<keyof TypesMap['operations']>
>(
  schema: SchemaInput,
  documentsMap: Documents,
  config: BuildMockingConfig<
    TypesMap['allOutputTypes'],
    TypesMap['allScalarTypes'],
    TypesMap['fieldArgsUsages'],
    Context
  > = {}
) => {
  type OperationKeys = keyof TypesMap['operations']
  type UsageTypes<Operation extends OperationKeys> = TypesMap['operations'][Operation]['typeUsages']
  type UsageType<Operation extends OperationKeys, Type extends keyof UsageTypes<Operation>> = UsageTypes<
    Operation
  >[Type]

  const { context, mocks: baseMocks } = config

  type Variables<Operation extends OperationKeys> = TypesMap['operations'][Operation]['variablesType']
  type OperationResult<Operation extends OperationKeys> = TypesMap['operations'][Operation]['operationType']
  type ArgsMap<Type extends PropertyKey> = PickIfExists<TypesMap['fieldArgsUsages'], Type>

  type MockOptions<Operation extends OperationKeys> = {
    mocks?: {
      [Type in keyof UsageTypes<Operation>]?: ResolvableValue<
        Context,
        MockFields<UsageType<Operation, Type>, ArgsMap<Type>, Context>
      >
    }
  } & RequireIfNotEmpty<'variables', Variables<Operation>>

  const gqlSchema = getSchema(schema)

  mockFields({ schema: gqlSchema })

  const getDocument = (operationName: OperationKeys): string => {
    // TODO: add lazy loading
    return print(addTypenames(documentsMap[operationName].document))
  }

  const mock = <Operation extends OperationKeys>(
    operationName: Operation,
    ...options: OptionalSpread<MockOptions<Operation>>
  ): ExecutionResult<OperationResult<Operation>> => {
    // We are spreading options and then taking the first one
    // because we want to allow users of this API
    // don't pass second argument if it isn't necessary
    // see https://github.com/microsoft/TypeScript/issues/12400#issuecomment-428599865
    const optionsObj = options[0]
    const document = getDocument(operationName)

    const extraContextContent: FieldMockOptions = {
      cache: {},
      mocks: [
        // TODO: fix type mappings between detailed types and broad ones
        { resolvers: defaultMocks as any, preservePrevious: false },
        { resolvers: baseMocks || {}, preservePrevious: false },
        { resolvers: (optionsObj?.mocks as any) || {}, preservePrevious: false },
      ],
    }

    const mockingContext: MagicContext = {
      ...context,
      [MAGIC_CONTEXT_MOCKS]: extraContextContent,
    }

    const result = graphqlSync({
      schema: gqlSchema,
      source: document,
      variableValues: optionsObj?.variables,
      contextValue: mockingContext,
    })
    return result
  }

  return { mock }
}
