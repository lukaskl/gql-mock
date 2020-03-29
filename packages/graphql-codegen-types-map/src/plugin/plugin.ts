import { PluginFunction } from '@graphql-codegen/plugin-helpers'
import { concatAST, DocumentNode } from 'graphql'

import { getOperationsMap } from './operationsParser'
import { OperationsPrinter, OperationsMapPrinterConfig } from './printer'

export const plugin: PluginFunction<OperationsMapPrinterConfig> = (schema, rawDocuments, config) => {
  const documents = rawDocuments
  const allAst = concatAST(documents.map(v => v.document).filter(x => !!x) as DocumentNode[])

  const operations = getOperationsMap(allAst)
  const operationsMapPrinter = new OperationsPrinter(operations, config)

  return operationsMapPrinter.operationsMapInterface
}
