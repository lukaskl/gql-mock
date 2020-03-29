import { parse, DocumentNode } from 'graphql'
import { schema } from '~/test-support'
import { plugin } from './plugin'
import { OperationsMapPrinterConfig } from './printer'

const runPlugin = async (ast: DocumentNode | DocumentNode[], config: OperationsMapPrinterConfig = {}) => {
  const asts = Array.isArray(ast) ? ast : [ast]
  return await plugin(
    schema,
    asts.map(x => ({ location: 'test-file.ts', document: x })),
    config,
    {
      outputFile: '',
    }
  )
}

describe('TypeScript Operations Map Plugin', () => {
  it('Anonymous operation throws an error', async () => {
    const ast = parse(/* GraphQL */ `
      query {
        notifications {
          id
        }
      }
    `)

    await expect(runPlugin(ast)).rejects.toThrow()
  })

  it('Test 1', async () => {
    const ast = parse(/* GraphQL */ `
      query q1 {
        search {
          ... on Movie {
            __typename
            id
            title
          }
          ... on Person {
            __typename
            id
            name
          }
        }
      }

      query q2 {
        search {
          __typename
          ... on Movie {
            id
            title
          }
          ... on Person {
            id
            name
          }
        }
      }
    `)
    const result = await runPlugin(ast)

    expect(result).toMatchSnapshot()
  })

  it('Test 2', async () => {
    const ast = parse(/* GraphQL */ `
      query search($trms: String!) {
        search(term: $trms) {
          id
        }
      }
    `)

    const result = await runPlugin(ast)

    expect(result).toMatchSnapshot()
  })

  it('Test 3', async () => {
    const ast1 = parse(/* GraphQL */ `
      query search1($trms: String!) {
        search(term: $trms) {
          id
        }
      }
    `)
    const ast2 = parse(/* GraphQL */ `
      query search2($trms: String!) {
        search(term: $trms) {
          id
        }
      }
    `)

    const result = await runPlugin([ast1, ast2])

    expect(result).toMatchSnapshot()
  })
})
