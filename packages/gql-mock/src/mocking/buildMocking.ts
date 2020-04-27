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
  parse,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLObjectType,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  GraphQLError,
} from 'graphql'
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
  RawDocumentMockOptions,
  BaseMockOptions,
  Variables,
} from './types'

export const MAGIC_FRAGMENTS_TYPE = 'Fragments2ba176b716364cc8a9cdf0dcf9c09761'

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

const emptyQuery = new GraphQLObjectType({ name: 'Query', fields: {} })
export const getAugmentedSchema = (input: GraphQLSchema): GraphQLSchema => {
  const inputConfig = input.toConfig()
  const queryConfig = (inputConfig.query || emptyQuery).toConfig()

  const rootTypeNames = [inputConfig.query, inputConfig.subscription, inputConfig.mutation]
    .map(x => x?.name)
    .filter(x => !!x)
  const outputTypes = inputConfig.types.filter(
    type =>
      !type.name.startsWith('__') &&
      !rootTypeNames.includes(type.name) &&
      !(type instanceof GraphQLInputObjectType)
  )

  const fieldsMap = outputTypes
    .map(x => ({ [x.name]: { type: new GraphQLNonNull(x) } }))
    .reduce((l, r) => ({ ...l, ...r }), {})
  const fragmentsType = new GraphQLObjectType({
    name: MAGIC_FRAGMENTS_TYPE,
    fields: fieldsMap as any,
  })

  const result = new GraphQLSchema({
    ...inputConfig,
    types: [...outputTypes, fragmentsType],
    subscription: inputConfig.subscription,
    mutation: inputConfig.mutation,
    query: new GraphQLObjectType({
      ...queryConfig,
      fields: {
        ...queryConfig.fields,
        ...{ [MAGIC_FRAGMENTS_TYPE]: { type: new GraphQLNonNull(fragmentsType) } },
      },
    }),
  })
  return result
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
  Int: 42,
  Float: 0.7,
  String: 'Hello World',
  Boolean: false,
  ID: '420de928-ad66-4bf1-a8cd-02c5df1e3e39',
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
  baseConfig: BuildMockingConfig<TypesMap, Context>,
  configOverrides: BaseMockOptions
): MagicContext => {
  const extraContextContent: FieldMockOptions = {
    cache: {},
    mocks: [
      { resolvers: defaultMocks as any, preservePrevious: false },
      ...ensureArray(baseConfig.mocks).map(x => ({
        resolvers: (x || {}) as Exclude<typeof x, undefined>,
        preservePrevious: true,
      })),

      ...ensureArray(mocks).map(x => ({
        resolvers: typeof x === 'function' ? x() : x,
        preservePrevious: true,
      })),
    ],
    mergingStrategy: configOverrides.mergingStrategy || baseConfig.mergingStrategy || 'preserve-deeper',
  }

  const mockingContext: MagicContext = {
    ...baseConfig.context,
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
): DocumentNode => {
  // TODO: add lazy loading
  // TODO: add config whether add typenames or not, defaulting to add
  return documentsMap[operationName].document
}

const augmentFragmentOperation = (
  document: DocumentNode,
  targetFragment?: string
): { targetFragmentType?: string; document: DocumentNode } => {
  const fragments = document.definitions.filter(
    x => x.kind === 'FragmentDefinition'
  ) as FragmentDefinitionNode[]
  const operations = document.definitions.filter(
    x => x.kind === 'OperationDefinition'
  ) as OperationDefinitionNode[]
  const fragmentsCount = fragments.length
  const operationsCount = operations.length

  if (operationsCount === 0) {
    if (fragmentsCount === 0) {
      throw new Error('No executable operation was passed')
    }
    if (fragmentsCount > 1 && !targetFragment) {
      throw new Error(
        `config.targetFragment variable is required when there are no operation definitions and more than one fragments definition, ` +
          `choose targetFragment from [${fragments.map(x => x.name.value).join(', ')}]`
      )
    }

    const fragmentName = fragmentsCount === 1 ? fragments[0].name.value : targetFragment
    const targetFragmentType = fragments.find(x => x.name.value === fragmentName)?.typeCondition.name.value

    if (!targetFragmentType || !fragmentName) {
      throw new Error(`Bug in the code - expected to estimate targetFragmentType of ${print(document)}`)
    }

    const fragmentsQuery: OperationDefinitionNode = {
      kind: 'OperationDefinition',
      operation: 'query',
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: MAGIC_FRAGMENTS_TYPE },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: targetFragmentType },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'FragmentSpread',
                        name: { kind: 'Name', value: fragmentName },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    }
    const augmentedDoc: DocumentNode = {
      kind: 'Document',
      definitions: [...fragments, fragmentsQuery],
    }

    return { document: augmentedDoc, targetFragmentType }
  }

  return { document, targetFragmentType: undefined }
}

const augmentDocument = (document: DocumentNode | string, targetFragment?: string) => {
  const parsedDoc = typeof document === 'string' ? parse(document) : document
  const { targetFragmentType, document: documentHandlingFragments } = augmentFragmentOperation(
    parsedDoc,
    targetFragment
  )
  const augmentedDocument = addTypenames(documentHandlingFragments)

  return { targetFragmentType, augmentedDocument, originalDocument: parsedDoc }
}

const executeGraphqlOperation = <
  ExecutionResultData,
  Variables extends {} = {},
  ExtraContext extends {} = {}
>(
  schema: GraphQLSchema,
  document: DocumentNode | string,
  variableValues: Variables | undefined,
  extraContext: ExtraContext,
  targetOperation?: string
): EnhancedExecutionResult<ExecutionResultData, Variables, ExtraContext> => {
  try {
    const { targetFragmentType, augmentedDocument, originalDocument } = augmentDocument(
      document,
      targetOperation
    )

    const enhancedResultData = {
      document: originalDocument,
      augmentedDocument,
      variables: variableValues,
      // TODO: support passing context
      context: {} as ExtraContext,
    }

    try {
      const source = print(augmentedDocument)
      const result = graphqlSync<ExecutionResultData>({
        schema,
        source,
        variableValues,
        contextValue: extraContext,
      })

      if (targetFragmentType) {
        const { data, errors } = result
        const updatedData = (data as any)?.[MAGIC_FRAGMENTS_TYPE]?.[
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          targetFragmentType!
        ] as ExecutionResultData
        return {
          data: updatedData,
          errors,
          ...enhancedResultData,
        }
      }

      return { ...result, ...enhancedResultData }
    } catch (err) {
      return {
        data: undefined,
        errors: [new GraphQLError(err?.message, undefined, undefined, undefined, undefined, err)],
        ...enhancedResultData,
      }
    }
  } catch (err) {
    return {
      data: undefined,
      errors: [new GraphQLError(err?.message, undefined, undefined, undefined, undefined, err)],
      document: typeof document !== 'string' ? document : { definitions: [], kind: 'Document' },
      augmentedDocument: { definitions: [], kind: 'Document' },
      variables: variableValues,
      // TODO: support passing context
      context: {} as ExtraContext,
    }
  }
}

interface ExecuteFn {
  <ExecutionResultData, Variables extends {} = {}, ExtraContext extends {} = {}>(
    document: DocumentNode | string,
    variableValues: Variables | undefined,
    extraContext: ExtraContext,
    targetOperation?: string
  ): EnhancedExecutionResult<ExecutionResultData, Variables, ExtraContext>
}

export interface EnhancedExecutionResult<Data, Variables, Context> extends ExecutionResult<Data> {
  document: DocumentNode
  augmentedDocument: DocumentNode
  variables?: Variables
  context: Context
}

export const buildMocking = <
  TypesMap extends {
    operations: { [key in keyof TypesMap['operations']]: AnyOperationMap }
    fieldArgsUsages: {}
    allOutputTypes: {}
    allScalarTypes: {}
  },
  Context = {},
  Documents extends DocumentsMap<keyof TypesMap['operations']> = DocumentsMap<keyof TypesMap['operations']>,
  LooseMocks extends boolean = false
>(
  schemaInput: SchemaInput,
  documentsMap: Documents,
  config: BuildMockingConfig<TypesMap, Context, LooseMocks> = {}
) => {
  const schema = getAugmentedSchema(getSchema(schemaInput))

  mockFields({ schema })

  const execute: ExecuteFn = (document, variableValues, extraContext, targetOperation) =>
    executeGraphqlOperation(schema, document, variableValues, extraContext, targetOperation)

  const mock = <Operation extends OperationKeys<TypesMap>>(
    operationName: Operation,
    ...options: OptionalSpread<OperationMockOptions<TypesMap, Operation>>
  ): EnhancedExecutionResult<OperationResult<TypesMap, Operation>, Variables<TypesMap, Operation>, {}> => {
    const { mocks, variables, ...overrides } = options[0] || {}
    const document = getDocument<TypesMap, Operation, Documents>(operationName, documentsMap)
    const context = buildMockingContext(mocks || {}, config, overrides)

    const result = execute<OperationResult<TypesMap, Operation>>(
      document,
      variables,
      context,
      operationName as string
    )
    return result
  }

  const mockDocument = <ExecutionResultData = unknown, Variables extends {} = {}>(
    document: string | DocumentNode,
    ...options: OptionalSpread<RawDocumentMockOptions<TypesMap, Variables, Context, LooseMocks>>
  ): EnhancedExecutionResult<ExecutionResultData, Variables, {}> => {
    const { mocks, variables, targetFragment, ...overrides } = options[0] || {}
    const context = buildMockingContext(mocks || {}, config, overrides)

    const result = execute<ExecutionResultData, Variables>(document, variables, context, targetFragment)
    return result
  }

  return { mock, mockDocument }
}
