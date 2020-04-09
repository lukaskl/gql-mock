import { PluginFunction, Types } from '@graphql-codegen/plugin-helpers'
import { concatAST, DocumentNode } from 'graphql'

import { OperationsParser } from './parser'
import { AllConfigOptions, PrinterConfig, OperationsMapPrinter } from './printer'
import { ReplaceReturnType } from '~/utils'

export interface OperationsMapPrinterConfig {
  operationsMap: Partial<AllConfigOptions>
}

export type Plugin = ReplaceReturnType<
  PluginFunction<OperationsMapPrinterConfig>,
  Types.Promisable<Types.ComplexPluginOutput>
>

export const plugin: Plugin = (schema, rawDocuments, rawConfig) => {
  try {
    const config = new PrinterConfig(rawConfig.operationsMap)
    config.validateConfig()

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

    const parser = new OperationsParser(allAst, schema)

    const operationsMapPrinter = new OperationsMapPrinter(parser, config)

    return operationsMapPrinter.allContent
  } catch (err) {
    console.log(err)
    throw err
  }
}
