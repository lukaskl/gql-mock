import { expandTemplate, OperationTemplateVariables } from './expandTemplate'
import { PrinterConfig } from './config'
import { OperationsParser } from '~/plugin'
import { Types } from '@graphql-codegen/plugin-helpers'
import { printTypeUsages } from './typeUsages'
import { LazyGetter as Lazy } from 'lazy-get-decorator'

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

  @Lazy()
  get commonPrependItems(): Types.ComplexPluginOutput {
    const { importTypesFrom, importedTypesAlias } = this.config.importTypes

    const prepend = [importTypesFrom && `import * as ${importedTypesAlias} from '${importTypesFrom}'`].filter(
      x => !!x
    ) as string[]

    return { content: '', prepend }
  }

  @Lazy()
  get allContent(): Types.ComplexPluginOutput {
    const { withTypeUsages } = this.config.typeUsages

    return mergeOutputs(
      '\n',
      this.commonPrependItems,
      withTypeUsages ? this.typeUsages : emptyOutput,
      this.operationsMapInterface
    )
  }

  @Lazy()
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

  @Lazy()
  get operationsMapInterface(): Types.ComplexPluginOutput {
    const { content, ...rest } = this.operationsMapFields

    return {
      ...rest,
      content: `export interface OperationsMap {\n  ${content}\n}`,
    }
  }

  @Lazy()
  private get operationsMapFields(): Types.ComplexPluginOutput {
    const { parser, config } = this
    const { allOperations } = parser

    const { operationKindTemplate, operationTypeTemplate, variablesTypeTemplate } = config.templates
    const { importRef } = config.importTypes
    const { withTypeUsages, typeUsagesTemplate } = config.typeUsages

    const content = allOperations
      .map(operation => {
        const variables: OperationTemplateVariables = {
          operationName: operation.name,
          operationKind: operation.kind,
        }
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

    return { content }
  }
}
