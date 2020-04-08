import { Types } from '@graphql-codegen/plugin-helpers'
import { FieldArgsUsages } from '~/plugin/parser'
import { expandTemplate, FieldArgsTemplateVariables } from './expandTemplate'

export interface PrintFieldArgsUsagesProps {
  fieldArgsTypeTemplate: string
  importRef: string
  fieldArgsUsages: FieldArgsUsages
}

export interface PrintTypeFieldsMapProps {
  fieldArgsTypeTemplate: string
  importRef: string
  parentName: string
  fieldNames: string[]
}

const printTypeFieldsMap = ({
  parentName,
  fieldNames,
  fieldArgsTypeTemplate,
  importRef,
}: PrintTypeFieldsMapProps) => {
  const fields = fieldNames
    .map(fieldName => {
      const argsType =
        importRef +
        expandTemplate<FieldArgsTemplateVariables>(fieldArgsTypeTemplate, { parentName, fieldName })
      return `${fieldName}: ${argsType}`
    })
    .join(',\n    ')
  return `'${parentName}': {\n    ${fields}\n  }`
}

export const printFieldArgsUsages = (props: PrintFieldArgsUsagesProps): Types.ComplexPluginOutput => {
  const { importRef, fieldArgsTypeTemplate, fieldArgsUsages } = props

  const fields = Object.entries(fieldArgsUsages)
    .map(([parentName, fieldNames]) =>
      printTypeFieldsMap({ parentName, fieldNames, fieldArgsTypeTemplate, importRef })
    )
    .join(',\n  ')

  const content = `export interface FieldArgsUsagesMap {\n  ${fields}\n}`
  return { content }
}
