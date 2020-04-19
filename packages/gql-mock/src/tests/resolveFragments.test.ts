import { parse } from 'graphql'
import { buildMocking } from '~/mocking'

const schema = /* GraphQL */ `
  scalar Date
  enum FetchType {
    NEW
    OLD
  }

  type Product {
    id: Int
    name: String
  }

  type Order {
    id: Int
    date: Date
  }

  union SearchResult = Product | Order

  interface List {
    total: Int
  }

  type DistributorList implements List {
    total: Int
    distributors: [String]
  }

  type ProductIdsList implements List {
    total: Int
    ids: [Int]
  }

  schema {
    query: Query
  }

  type Query {
    fakeQuey: Int!
  }
`

const date = new Date()

const { mockDocument } = buildMocking<any, any, any, true>(schema, {}, { mocks: { Date: date } })

describe('resolving fragments', () => {
  it('possible to resolve fragment definition', () => {
    const { data, errors } = mockDocument(`fragment AnyName on Product { id, name }`)
    expect(errors).toBeFalsy()
    expect(data).toEqual({ id: 42, name: 'Hello World', __typename: 'Product' })
  })

  it('possible to resolve parsed fragment definition', () => {
    const { data, errors } = mockDocument(parse(`fragment AnyName on Product { id, name }`))
    expect(errors).toBeFalsy()
    expect(data).toEqual({ id: 42, name: 'Hello World', __typename: 'Product' })
  })

  it('necessary to pass targetFragment when there are more than one fragment', () => {
    const { data, errors } = mockDocument(`
      fragment ProductIdentity on Product { id }
      fragment AnyName on Product { ...ProductIdentity, name }
    `)

    expect(errors?.[0].message).toBe(
      'config.targetFragment variable is required when there are no operation definitions ' +
        'and more than one fragments definition, choose targetFragment from [ProductIdentity, AnyName]'
    )
    expect(data).toBeUndefined()
  })

  it('possible to indicate which fragment to mock', () => {
    const { data, errors } = mockDocument(
      `
      fragment ProductIdentity on Product { id }
      fragment AnyName on Product { ...ProductIdentity, name }
    `,
      { targetFragment: 'AnyName' }
    )

    expect(errors).toBeFalsy()
    expect(data).toEqual({ id: 42, name: 'Hello World', __typename: 'Product' })
  })

  it('non used fragments still throws errors', () => {
    const { data, errors } = mockDocument(
      `
      fragment ProductIdentity on Product { id }
      fragment AnyName on Product { ...ProductIdentity, name }
    `,
      { targetFragment: 'ProductIdentity' }
    )

    expect(errors?.[0].message).toBe('Fragment "AnyName" is never used.')
    expect(data).toBeUndefined()
  })
})
