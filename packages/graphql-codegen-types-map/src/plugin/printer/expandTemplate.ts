import * as changeCase from 'change-case'
import { parse } from 'esprima'
import { OperationTypeNode } from 'graphql'
import evaluate from 'static-eval'
import { ERRORS, fromEntries } from '~/utils'
import { GraphQLSchemaOutputTypes } from '../parser'

const casingOperations = (Object.keys(changeCase) as (keyof typeof changeCase)[])
  .map(x => ({ [x]: changeCase[x] }))
  .reduce((l, r) => ({ ...l, ...r }), {})

export type OperationKind = OperationTypeNode | 'fragment'
export interface OperationTemplateVariables {
  operationName: string
  operationKind: OperationKind
}

export interface FieldArgsTemplateVariables {
  parentName: string
  fieldName: string
}

export interface TypeAccessorTemplateVariables {
  typeName: string
  typeKind: GraphQLSchemaOutputTypes
}

export type TemplateVariables =
  | FieldArgsTemplateVariables
  | OperationTemplateVariables
  | TypeAccessorTemplateVariables

export const expandTemplate = <T extends TemplateVariables>(template: string, variables: T): string => {
  const ast = (parse('`' + template.replace(/{/g, '${') + '`').body[0] as any).expression

  const allVariables = {
    ...fromEntries(
      Object.entries(variables).map(([name, value]) => [
        changeCase.pascalCase(name),
        changeCase.pascalCase(value),
      ])
    ),
    ...variables,
  }

  const result: string = evaluate(ast, {
    ...casingOperations,
    ...allVariables,
  })
  if (result.includes('[object Object]')) {
    return ERRORS.invalidTemplate(template, allVariables, casingOperations)
  }
  return result
}

const validateTemplate = (templates: string[], dummyVariables: TemplateVariables) => {
  for (const template of templates) {
    expandTemplate(template, dummyVariables)
  }
}

export const validateOperationsTemplate = (...templates: string[]) =>
  validateTemplate(templates, {
    operationKind: 'query',
    operationName: 'validation',
  })

export const validateFieldArgsTemplate = (...templates: string[]) =>
  validateTemplate(templates, {
    fieldName: 'field-name',
    parentName: 'parent-name',
  })

export const validateTypeAccessorTemplate = (...templates: string[]) =>
  validateTemplate(templates, {
    typeKind: 'interface',
    typeName: 'fake-name',
  })
