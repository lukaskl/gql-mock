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

import { FieldMockOptions, MAGIC_CONTEXT_MOCKS, MagicContext, mockFields } from './mockFields'
import {
  AnyOperationMap,
  BuildMockingConfig,
  DocumentsMap,
  NaiveIntrospectionResult,
  OperationKeys,
  OperationMockOptions,
  OperationResult,
  OptionalSpread,
  SchemaInput,
  TypeMocks,
  UserMocksInput,
} from './types'

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

const defaultMocks: TypeMocks = {
  Int: () => Math.round(Math.random() * 200) - 100,
  Float: () => Math.random() * 200 - 100,
  String: 'Hello World',
  Boolean: () => Math.random() > 0.5,
  ID: () => uuid.v4(),
}

const ensureArray = <T>(item: T | T[]): T[] => (Array.isArray(item) ? item : [item])

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

  const getDocument = (operationName: OperationKeys<TypesMap>): string => {
    // TODO: add lazy loading
    return print(addTypenames(documentsMap[operationName].document))
  }

  const buildMockingContext = <Operation extends OperationKeys<TypesMap>>(
    mocks: UserMocksInput<TypesMap, Operation> = {}
  ): MagicContext => {
    const extraContextContent: FieldMockOptions = {
      cache: {},
      mocks: [
        { resolvers: defaultMocks as any, preservePrevious: false },
        ...ensureArray(config.mocks).map(x => ({
          resolvers: (x || {}) as Exclude<typeof x, undefined>,
          preservePrevious: false,
        })),

        ...ensureArray(mocks).map(x => ({
          resolvers: (x || {}) as Exclude<typeof x, undefined>,
          preservePrevious: false,
        })),
        // TODO: fix typing - resolve passed broad type mocks
      ] as any,
    }

    const mockingContext: MagicContext = {
      ...config.context,
      [MAGIC_CONTEXT_MOCKS]: extraContextContent,
    }
    return mockingContext
  }

  const mock = <Operation extends OperationKeys<TypesMap>>(
    operationName: Operation,
    ...options: OptionalSpread<OperationMockOptions<TypesMap, Operation>>
  ): ExecutionResult<OperationResult<TypesMap, Operation>> => {
    // We are spreading options and then taking the first one
    // because we want to allow users of this API
    // don't pass second argument if it isn't necessary
    // see https://github.com/microsoft/TypeScript/issues/12400#issuecomment-428599865
    const optionsObj = options[0]
    const source = getDocument(operationName)

    const contextValue = buildMockingContext(optionsObj?.mocks)
    const variableValues = optionsObj?.variables
    const result = graphqlSync({ schema, source, variableValues, contextValue })
    return result
  }

  return { mock }
}
