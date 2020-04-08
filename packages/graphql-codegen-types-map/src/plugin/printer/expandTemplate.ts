import * as changeCase from 'change-case'
import { parse } from 'esprima'
import { OperationTypeNode } from 'graphql'
import evaluate from 'static-eval'
import { ERRORS } from '~/utils'

export type OperationKind = OperationTypeNode | 'fragment'
export interface OperationTemplateVariables {
  operationName: string
  operationKind: OperationKind
}

const casingOperations = (Object.keys(changeCase) as (keyof typeof changeCase)[])
  .map(x => ({ [x]: changeCase[x] }))
  .reduce((l, r) => ({ ...l, ...r }), {})

export const expandTemplate = (template: string, variables: OperationTemplateVariables) => {
  const ast = (parse('`' + template.replace(/{/g, '${') + '`').body[0] as any).expression

  const allVariables = {
    ...variables,
    OperationName: changeCase.pascalCase(variables.operationName),
    OperationKind: changeCase.pascalCase(variables.operationKind),
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

export const validateTemplate = (...templates: string[]) => {
  const validationVariables: OperationTemplateVariables = {
    operationKind: 'query',
    operationName: 'validation',
  }
  for (const template of templates) {
    expandTemplate(template, validationVariables)
  }
}
