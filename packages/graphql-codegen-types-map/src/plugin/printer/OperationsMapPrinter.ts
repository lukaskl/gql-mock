import { expandTemplate, OperationTemplateVariables } from './expandTemplate'
import { PrinterConfig } from './config'
import { OperationsParser, OutputTypeEntry, GraphQLSchemaTypes } from '~/plugin'
import { Types } from '@graphql-codegen/plugin-helpers'
import { printTypeUsages } from './typeUsages'
import { LazyGetter as Lazy } from 'lazy-get-decorator'
import { printFieldArgsUsages } from './fieldArgsUsages'

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
    const { withTypeUsages, withDocumentsMap } = this.config.allOptions

    return mergeOutputs(
      '\n\n',
      this.commonPrependItems,

      this.allOutputTypes,
      this.allScalarTypes,
      withTypeUsages ? this.fieldArgsUsages : emptyOutput,
      withTypeUsages ? this.typeUsages : emptyOutput,
      this.operationsMapInterface,
      this.typesMap,
      withDocumentsMap ? this.documentsMap : emptyOutput
    )
  }

  @Lazy()
  get typesMap(): Types.ComplexPluginOutput {
    const { withTypeUsages } = this.config.typeUsages

    const fields = [
      'operations: OperationsMap',
      `fieldArgsUsages: ${withTypeUsages ? 'FieldArgsUsagesMap' : '{}'}`,
      `allOutputTypes: AllOutputTypes`,
      `allScalarTypes: AllScalarTypes`,
    ].join('\n  ')

    return { content: `export interface TypesMap {\n  ${fields}\n}` }
  }

  @Lazy()
  get fieldArgsUsages(): Types.ComplexPluginOutput {
    const { parser, config } = this
    const { fieldArgsUsages } = parser

    const { importRef } = config.importTypes
    const { fieldArgsTypeTemplate } = config.fieldArgsTemplates

    return printFieldArgsUsages({
      fieldArgsTypeTemplate,
      importRef,
      fieldArgsUsages,
    })
  }

  @Lazy()
  get typeUsages(): Types.ComplexPluginOutput {
    const { parser, config } = this

    const { typeUsages } = parser

    const { importRef } = config.importTypes
    const { typeUsagesTemplate, operationTypeTemplate } = config.operationTemplates

    return printTypeUsages({
      typeUsagesList: typeUsages,
      importRef,
      typeUsagesTemplate,
      operationTypeTemplate,
    })
  }

  @Lazy()
  private get operationsMapInterface(): Types.ComplexPluginOutput {
    const { parser, config } = this
    const { allDefinitions } = parser

    const { operationKindTemplate, operationTypeTemplate, variablesTypeTemplate } = config.operationTemplates
    const { importRef } = config.importTypes
    const { withTypeUsages, typeUsagesTemplate } = config.typeUsages

    const fields = allDefinitions
      .map(definition => {
        const variables: OperationTemplateVariables = {
          operationName: definition.name,
          operationKind: definition.kind,
        }
        const expand = (template: string) => expandTemplate(template, variables)

        const fields = [
          `operationType: ${importRef}${expand(operationTypeTemplate)}`,
          `variablesType: ${
            definition.kind === 'fragment' ? '{}' : importRef + expand(variablesTypeTemplate)
          }`,
          withTypeUsages && `typeUsages: ${expand(typeUsagesTemplate)}`,
          `kind: '${expand(operationKindTemplate)}'`,
        ]

        return `'${definition.name}': { ${fields.filter(x => !!x).join(', ')} }`
      })
      .join('\n  ')

    return { content: `export interface OperationsMap {\n  ${fields}\n}` }
  }

  @Lazy()
  get documentsMap(): Types.ComplexPluginOutput {
    const { parser, config } = this
    const { allDefinitions } = parser

    const { operationKindTemplate, operationDocumentTemplate } = config.operationTemplates
    const { importRef } = config.importTypes

    const fields = allDefinitions
      .map(definition => {
        const variables: OperationTemplateVariables = {
          operationName: definition.name,
          operationKind: definition.kind,
        }
        const expand = (template: string) => expandTemplate(template, variables)

        const fields = [
          `document: ${importRef}${expand(operationDocumentTemplate)}`,
          `kind: '${expand(operationKindTemplate)}' as const`,
        ]

        return `'${definition.name}': { ${fields.filter(x => !!x).join(', ')} }`
      })
      .join(',\n  ')

    return { content: `export const documentsMap = {\n  ${fields}\n}` }
  }

  @Lazy()
  get allOutputTypes(): Types.ComplexPluginOutput {
    return this.getTypesMap(this.parser.outputTypes, 'AllOutputTypes')
  }

  @Lazy()
  get allScalarTypes(): Types.ComplexPluginOutput {
    return this.getTypesMap(this.parser.scalarTypes, 'AllScalarTypes')
  }

  private getTypesMap = <T extends GraphQLSchemaTypes>(
    entries: OutputTypeEntry<T>[],
    interfaceName: string
  ) => {
    const { config } = this
    const { typeAccessorTypeTemplate } = config.typeAccessorTemplates
    const { importRef } = config.importTypes

    const fields = entries
      .map(
        ({ kind, name }) =>
          `'${name}': ${importRef}${expandTemplate(typeAccessorTypeTemplate, {
            typeKind: kind,
            typeName: name,
          })}`
      )
      .join('\n  ')

    return { content: `export type ${interfaceName} = {\n  ${fields}\n}` }
  }
}
