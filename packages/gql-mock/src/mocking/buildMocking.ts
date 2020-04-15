import {
  buildClientSchema,
  buildSchema,
  DocumentNode,
  ExecutionResult,
  GraphQLSchema,
  graphqlSync,
  print,
  SelectionSetNode,
  visit,
} from 'graphql'
import * as uuid from 'uuid'
import { ensureArray, OptionalSpread } from '~/utils'

import { FieldMockOptions, MAGIC_CONTEXT_MOCKS, MagicContext, mockFields } from './mockFields'
import {
  AnyOperationMap,
  BuildMockingConfig,
  DocumentsMap,
  NaiveIntrospectionResult,
  OperationKeys,
  OperationMockOptions,
  OperationResult,
  SchemaInput,
  TypeMocks,
  UserMocksInput,
} from './types'

export const isIntrospectionQuery = (input: SchemaInput): input is NaiveIntrospectionResult =>
  !!(input as { __schema: any }).__schema

export const getSchema = (input: SchemaInput): GraphQLSchema => {
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

export function addTypenames(document: DocumentNode): DocumentNode {
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

export const defaultMocks: TypeMocks = {
  Int: () => Math.round(Math.random() * 200) - 100,
  Float: () => Math.random() * 200 - 100,
  String: 'Hello World',
  Boolean: () => Math.random() > 0.5,
  ID: () => uuid.v4(),
}

const buildMockingContext = <
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Operation extends OperationKeys<TypesMap>,
  Context = {}
>(
  mocks: UserMocksInput<TypesMap, Operation>,
  config: BuildMockingConfig<TypesMap, Context>
): MagicContext => {
  const extraContextContent: FieldMockOptions = {
    cache: {},
    mocks: [
      { resolvers: defaultMocks as any, preservePrevious: false },
      ...ensureArray(config.mocks).map(x => ({
        resolvers: (x || {}) as Exclude<typeof x, undefined>,
        preservePrevious: true,
      })),

      ...ensureArray(mocks).map(x => ({
        resolvers: typeof x === 'function' ? x() : x,
        preservePrevious: true,
      })),
    ],
  }

  const mockingContext: MagicContext = {
    ...config.context,
    [MAGIC_CONTEXT_MOCKS]: extraContextContent,
  }
  return mockingContext
}

const getDocument = <
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
  },
  Operation extends OperationKeys<TypesMap>,
  Documents extends DocumentsMap<keyof TypesMap['operations']>
>(
  operationName: Operation,
  documentsMap: Documents
): string => {
  // TODO: add lazy loading
  // TODO: add config whether add typenames or not, defaulting to add
  return print(addTypenames(documentsMap[operationName].document))
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
  schemaInput: SchemaInput,
  documentsMap: Documents,
  config: BuildMockingConfig<TypesMap, Context> = {}
) => {
  const schema = getSchema(schemaInput)

  mockFields({ schema })

  const mock = <Operation extends OperationKeys<TypesMap>>(
    operationName: Operation,
    ...options: OptionalSpread<OperationMockOptions<TypesMap, Operation>>
  ): ExecutionResult<OperationResult<TypesMap, Operation>> => {
    const { mocks, variables } = options[0] || {}
    const source = getDocument<TypesMap, Operation, Documents>(operationName, documentsMap)

    const contextValue = buildMockingContext(mocks || {}, config)
    const variableValues = variables
    const result = graphqlSync({ schema, source, variableValues, contextValue })
    return result
  }

  return { mock }
}
