import {
  GraphQLSchema,
  buildClientSchema,
  graphqlSync,
  print,
  visit,
  DocumentNode,
  SelectionSetNode,
  GraphQLFieldResolver,
  ExecutionResult,
  buildSchema,
} from 'graphql'
import { IMocks } from 'graphql-tools'
import { MAGIC_CONTEXT_MOCKS, mockFields, MockingContext } from './mockFields'

import * as uuid from 'uuid'

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

export type TypeMock<T extends {}> = T | (() => T) | undefined

export type TypeMocks = { [key: string]: TypeMock<{}> | undefined }

type NormalizedMocks = IMocks

const mergeMocks = (mocks: TypeMocks[]): NormalizedMocks => {
  const mocksMap: { [typeName: string]: TypeMock<{}>[] } = {}

  for (const mock of mocks) {
    for (const [typeName, typeMock] of Object.entries(mock)) {
      if (!mocksMap[typeName]) {
        mocksMap[typeName] = []
      }
      mocksMap[typeName].push(typeMock)
    }
  }

  const mergedMocks = Object.keys(mocksMap).map(typeName => {
    const resolver: GraphQLFieldResolver<unknown, unknown> = (source, args, context, info) => {
      const typeMocks = mocksMap[typeName]
      const reducedMock = typeMocks.reduce(
        (l, r) => ({ ...l, ...(typeof r === 'function' ? (r as any)(source, args, context, info) : r) }),
        {}
      )
      return reducedMock
    }
    return { [typeName]: resolver }
  })
  return mergedMocks.reduce((l, r) => ({ ...l, ...r }), {})
}

type KeyByTypes<Base extends {}, TypesToPick> = Exclude<
  {
    [Key in keyof Base]: Base[Key] extends TypesToPick ? Key : never
  }[keyof Base],
  undefined
>
type KeysByExcludedTypes<Base extends {}, TypesToExclude> = Exclude<
  {
    [Key in keyof Base]: Base[Key] extends TypesToExclude ? never : Key
  }[keyof Base],
  undefined
>

type ArrayFields<T> = KeyByTypes<NonNullable<T>, any[] | readonly any[] | undefined | null>
type ScalarFields<T> = KeysByExcludedTypes<
  NonNullable<T>,
  { __typename: any } | undefined | null | any[] | readonly any[]
>

type Maybe<T> = T | null

type Arr<T> = Maybe<T>[] | readonly Maybe<T>[]
type UnpackArr<T> = T extends Arr<infer U> ? U : never

type MockList = any[]

type MockScalars<T> = {
  [key in ScalarFields<T>]: TypeMock<NonNullable<T>[key]>
}

type MockArrays<T> = {
  [key in ArrayFields<T>]: UnpackArr<NonNullable<T>[key]> extends { __typename: any }
    ? null extends NonNullable<T>[key]
      ? null | (() => MockList | null)
      : () => MockList
    : NonNullable<T>[key] | (() => MockList)
}

type MockFields<T> = Partial<MockScalars<T> & MockArrays<T>>

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
  String: () => 'Hello World',
  Boolean: () => Math.random() > 0.5,
  ID: () => uuid.v4(),
}

export const buildMocking = <
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
  },
  Documents extends DocumentsMap<keyof TypesMap['operations']> = DocumentsMap<keyof TypesMap['operations']>
>(
  schema: SchemaInput,
  documentsMap: Documents
) => {
  type OperationKeys = keyof TypesMap['operations']
  type UsageTypes<Operation extends OperationKeys> = TypesMap['operations'][Operation]['typeUsages']
  type UsageType<Operation extends OperationKeys, Type extends keyof UsageTypes<Operation>> = UsageTypes<
    Operation
  >[Type]

  type Variables<Operation extends OperationKeys> = TypesMap['operations'][Operation]['variablesType']
  type OperationResult<Operation extends OperationKeys> = TypesMap['operations'][Operation]['operationType']

  type MockOptions<Operation extends OperationKeys> = {
    mocks?: {
      [Type in keyof UsageTypes<Operation>]?: MockFields<UsageType<Operation, Type>>
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

    // TODO: figure it out how to mock resolvers
    // without altering the schema on every mock and
    // therefore littering environment for the next test
    // addMockFunctionsToSchema({
    //   schema: gqlSchema,
    //   mocks: ,
    //   preserveResolvers: true,
    // })

    const context: MockingContext = {
      [MAGIC_CONTEXT_MOCKS]: {
        cache: {},
        // TODO: restructure & normalize mocks by Type
        mocks: { ...defaultMocks, ...(optionsObj?.mocks || {}) },
      },
    }

    const result = graphqlSync({
      schema: gqlSchema,
      source: document,
      variableValues: optionsObj?.variables,
      contextValue: context,
      fieldResolver: (root, args, context, info) => {
        return ''
      },
      typeResolver: (root, args, context, info) => {
        return ''
      },
    })
    return result
  }

  return { mock }
}
