import * as changeCase from 'change-case'
import { parse } from 'esprima'
import { OperationTypeNode } from 'graphql'
import evaluate from 'static-eval'

export interface TemplateVariables {
  operationName: string
  operationKind: OperationTypeNode
}

const casingOperations = (Object.keys(changeCase) as (keyof typeof changeCase)[])
  .map(x => ({ [x]: changeCase[x] }))
  .reduce((l, r) => ({ ...l, ...r }), {})

export const expandTemplate = (template: string, variables: TemplateVariables) => {
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

export const validateTemplates = (...templates: string[]) => {
  const validationVariables: TemplateVariables = {
    operationKind: 'query',
    operationName: 'validation',
  }
  for (const template of templates) {
    expandTemplate(template, validationVariables)
  }
}
