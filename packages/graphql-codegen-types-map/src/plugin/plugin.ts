import { PluginFunction } from '@graphql-codegen/plugin-helpers'
import { concatAST, DocumentNode, TypeInfo } from 'graphql'

import { OperationsParser } from './parser'
import { AllConfigOptions, PrinterConfig, OperationsMapPrinter } from './printer'

export interface OperationsMapPrinterConfig {
  operationsMap: Partial<AllConfigOptions>
}

export const plugin: PluginFunction<OperationsMapPrinterConfig> = (schema, rawDocuments, rawConfig) => {
  try {
    const config = new PrinterConfig(rawConfig.operationsMap)
    config.validateConfig()
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

    const parser = new OperationsParser(allAst, typeInfo)

    const operationsMapPrinter = new OperationsMapPrinter(parser, config)

    return operationsMapPrinter.allContent
  } catch (err) {
    console.log(err)
    throw err
  }
}
