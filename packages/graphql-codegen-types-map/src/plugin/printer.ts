import { expandTemplate } from './expandTemplate'
import { OperationsMapEntry } from './operationsParser'
import { TemplatesConfig } from './plugin'

export interface OperationsMapPrinterConfig {
  operationsMap?: {
    operationKindTemplate?: string
    operationTypeTemplate?: string
    variablesTypeTemplate?: string
  }
}

export class OperationsPrinter {
  constructor(protected readonly operations: OperationsMapEntry[], readonly templates: TemplatesConfig) {}

  get operationsMapFields() {
    const { operationKindTemplate, operationTypeTemplate, variablesTypeTemplate } = this.templates

    return this.operations
      .map(x => {
        const opKind = expandTemplate(operationKindTemplate, x)
        const opType = expandTemplate(operationTypeTemplate, x)
        const varType = expandTemplate(variablesTypeTemplate, x)

        return `'${x.operationName}': { operationType: ${opType}, variablesType: ${varType}, kind: '${opKind}' }`
      })
      .join('\n  ')
  }

  get operationsMapInterface() {
    return `export interface OperationsMap {\n  ${this.operationsMapFields}\n}`
  }
}
