import { PluginFunction } from '@graphql-codegen/plugin-helpers'
import { concatAST, DocumentNode, TypeInfo } from 'graphql'

import { validateTemplates } from './expandTemplate'
import { getOperationsMap } from './operationsParser'
import { OperationsMapPrinterConfig, OperationsPrinter } from './printer'

const ensureConfigDefaults = (config: OperationsMapPrinterConfig) => {
  const {
    operationsMap: {
      operationTypeTemplate = '{pascalCase(operationName)}{pascalCase(operationKind)}',
      variablesTypeTemplate = '{pascalCase(operationName)}{pascalCase(operationKind)}Variables',
      operationKindTemplate = '{operationKind}',
    } = {},
  } = config

  validateTemplates(operationTypeTemplate, variablesTypeTemplate, operationKindTemplate)
  return { operationTypeTemplate, variablesTypeTemplate, operationKindTemplate }
}

export type TemplatesConfig = ReturnType<typeof ensureConfigDefaults>

export const plugin: PluginFunction<OperationsMapPrinterConfig> = (schema, rawDocuments, config) => {
  const templates = ensureConfigDefaults(config)
  const typeInfo = new TypeInfo(schema)

  const documents = rawDocuments
  const allAst = concatAST(
    documents
      .map(
        v =>
          v.document ||
          // The next line is to make it work with older versions (<= v1.6.1) of @graphql-codegen
          (v as any).content
      )
      .filter(x => !!x) as DocumentNode[]
  )

  const operations = getOperationsMap(typeInfo, allAst)
  const operationsMapPrinter = new OperationsPrinter(operations, templates)

  return operationsMapPrinter.operationsMapInterface
}
