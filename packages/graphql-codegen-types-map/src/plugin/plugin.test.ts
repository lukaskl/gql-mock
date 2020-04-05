import { parse, DocumentNode } from 'graphql'
import { dummySchema } from '~/test-support'
import { plugin } from './plugin'
import { AllConfigOptions } from './printer'

const runPlugin = async (ast: DocumentNode | DocumentNode[], config: Partial<AllConfigOptions> = {}) => {
  const asts = Array.isArray(ast) ? ast : [ast]
  return await plugin(
    dummySchema,
    asts.map(x => ({ location: 'test-file.ts', document: x })),
    { operationsMap: config },
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

  //TODO: fix the queries
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('Test 1', async () => {
    const ast = parse(/* GraphQL */ `
      query q1 {
        search(term: $trms) {
          ... on ImageNotification {
            __typename
            imageUrl
          }
          ... on Person {
            __typename
            id
            name
          }
        }
      }

      query q2 {
        search(term: "fake") {
          __typename
          ... on ImageNotification {
            id
            imageUrl
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
