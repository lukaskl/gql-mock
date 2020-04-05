import { expandTemplate, TemplateVariables } from './expandTemplate'
import { PrinterConfig } from './config'
import { OperationsParser } from '~/plugin'
import { Types } from '@graphql-codegen/plugin-helpers'
import { printTypeUsages } from './typeUsages'

const emptyOutput: Types.ComplexPluginOutput = { content: '' }

const mergeOutputs = (separator = '\n', ...outputs: Types.ComplexPluginOutput[]) => {
  const content = outputs.map(x => x.content).join(separator)

  let prepend: string[] = []
  let append: string[] = []

  for (const output of outputs) {
    append = [...(output.append || []), ...append]
    prepend = [...prepend, ...(output.prepend || [])]
  }

  return { prepend, append, content }
}

export class OperationsMapPrinter {
  constructor(readonly parser: OperationsParser, readonly config: PrinterConfig) {}

  get typeUsages(): Types.ComplexPluginOutput {
    const { parser, config } = this

    const { typeUsages } = parser

    const { importRef } = config.importTypes
    const { typeUsagesTemplate, operationTypeTemplate } = config.templates

    return printTypeUsages({
      typeUsagesList: typeUsages,
      importRef,
      typeUsagesTemplate,
      operationTypeTemplate,
    })
  }

  private get operationsMapFields(): Types.ComplexPluginOutput {
    const prepend: string[] = []

    const { parser, config } = this
    const { allOperations } = parser

    const { operationKindTemplate, operationTypeTemplate, variablesTypeTemplate } = config.templates
    const { importTypesFrom, importedTypesAlias, importRef } = config.importTypes
    const { withTypeUsages, typeUsagesTemplate } = config.typeUsages

    const typeUsagesResult = withTypeUsages ? this.typeUsages : emptyOutput

    if (importTypesFrom) {
      prepend.push(`import * as ${importedTypesAlias} from '${importTypesFrom}'`)
    }

    const content = allOperations
      .map(operation => {
        const variables: TemplateVariables = { operationName: operation.name, operationKind: operation.kind }
        const expand = (template: string) => expandTemplate(template, variables)

        const fields = [
          `operationType: ${importRef}${expand(operationTypeTemplate)}`,
          `variablesType: ${importRef}${expand(variablesTypeTemplate)}`,
          withTypeUsages && `typeUsages: ${expand(typeUsagesTemplate)}`,
          `kind: '${expand(operationKindTemplate)}'`,
        ]

        return `'${operation.name}': { ${fields.filter(x => !!x).join(', ')} }`
      })
      .join('\n  ')

    return mergeOutputs('\n', typeUsagesResult, { content, prepend })
  }

  get operationsMapInterface(): Types.ComplexPluginOutput {
    const { content, ...rest } = this.operationsMapFields

    return {
      ...rest,
      content: `export interface OperationsMap {\n  ${content}\n}`,
    }
  }
}
