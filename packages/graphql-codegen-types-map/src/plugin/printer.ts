import * as changeCase from 'change-case'
import { parse } from 'esprima'
import { OperationTypeNode } from 'graphql'
import evaluate from 'static-eval'

import { OperationsMapEntry } from './operationsParser'

export interface OperationsMapPrinterConfig {
  operationsMap?: {
    operationKindTemplate?: string
    operationTypeTemplate?: string
    variablesTypeTemplate?: string
  }
}

interface TemplateVariables {
  operationName: string
  operationKind: OperationTypeNode
}

const casingOperations = (Object.keys(changeCase) as (keyof typeof changeCase)[])
  .map(x => ({ [x]: changeCase[x] }))
  .reduce((l, r) => ({ ...l, ...r }), {})

const getName = (template: string, variables: TemplateVariables) => {
  const ast = (parse('`' + template.replace(/{/g, '${') + '`').body[0] as any).expression

  const result: string = evaluate(ast, {
    ...casingOperations,
    ...variables,
  })
  if (result.includes('[object Object]')) {
    const errorMessage =
      `Invalid variable or function name used in "operationsMap" template. ` +
      `Given template: "${template}". ` +
      `Allowed variables: "${Object.keys(variables).join(', ')}". ` +
      `Allowed functions: "${Object.keys(casingOperations).join(', ')}". ` +
      `e.g. template: "{pascalCase(operationName)}{pascalCase(operationKind)}Variables"`
    console.error(`ERROR: ${errorMessage}`)
    throw new Error(errorMessage)
  }
  return result
}

const ensureConfigDefaults = (config: OperationsMapPrinterConfig) => {
  const {
    operationsMap: {
      operationTypeTemplate = '{pascalCase(operationName)}{pascalCase(operationKind)}',
      variablesTypeTemplate = '{pascalCase(operationName)}{pascalCase(operationKind)}Variables',
      operationKindTemplate = '{operationKind}',
    } = {},
  } = config

  return { operationTypeTemplate, variablesTypeTemplate, operationKindTemplate }
}

export class OperationsPrinter {
  readonly templates: ReturnType<typeof ensureConfigDefaults>
  constructor(protected readonly operations: OperationsMapEntry[], config: OperationsMapPrinterConfig) {
    this.templates = ensureConfigDefaults(config)
  }

  get operationsMapFields() {
    const { operationKindTemplate, operationTypeTemplate, variablesTypeTemplate } = this.templates

    return this.operations
      .map(x => {
        const opKind = getName(operationKindTemplate, x)
        const opType = getName(operationTypeTemplate, x)
        const varType = getName(variablesTypeTemplate, x)

        return `'${x.operationName}': { operationType: ${opType}, variablesType: ${varType}, kind: '${opKind}' }`
      })
      .join('\n  ')
  }

  get operationsMapInterface() {
    return `export interface OperationsMap {\n  ${this.operationsMapFields}\n}`
  }
}
