import * as changeCase from 'change-case'
import { parse } from 'esprima'
import { OperationTypeNode } from 'graphql'
import evaluate from 'static-eval'

import { OperationsMapEntry } from './operationsParser'

export interface OperationsMapPrinterConfig {
  templates?: {
    operationName?: string
    operationType?: string
    variablesType?: string
  }
}

interface TemplateVariables {
  operationName: string
  operation: OperationTypeNode
}

const casingOperations = (Object.keys(changeCase) as (keyof typeof changeCase)[])
  .map(x => ({ [x]: changeCase[x] }))
  .reduce((l, r) => ({ ...l, ...r }), {})

const getName = (template: string, variables: TemplateVariables) => {
  const ast = (parse('`' + template + '`').body[0] as any).expression

  return evaluate(ast, {
    ...casingOperations,
    ...variables,
  })
}

const ensureConfigDefaults = (config: OperationsMapPrinterConfig) => {
  const {
    templates: {
      operationType = '${pascalCase(operationName)}${pascalCase(operation)}',
      variablesType = '${pascalCase(operationName)}${pascalCase(operation)}Variables',
      operationName = '${operationName}',
    } = {},
  } = config

  return { operationType, variablesType, operationName }
}

export class OperationsPrinter {
  readonly config: ReturnType<typeof ensureConfigDefaults>
  constructor(protected readonly operations: OperationsMapEntry[], config: OperationsMapPrinterConfig) {
    this.config = ensureConfigDefaults(config)
  }

  get operationsMapFields() {
    const { operationName, operationType, variablesType } = this.config

    return this.operations
      .map(x => {
        const opName = getName(operationName, x)
        const opType = getName(operationType, x)
        const varType = getName(variablesType, x)

        return `'${opName}': { operationType: ${opType}, variablesType: ${varType}, type: '${x.operation}' }`
      })
      .join('\n  ')
  }

  get operationsMapInterface() {
    return `export interface OperationsMap {\n  ${this.operationsMapFields}\n}`
  }
}
