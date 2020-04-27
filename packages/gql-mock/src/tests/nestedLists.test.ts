import { buildMocking } from '~/mocking'

const schema = /* GraphQL */ `
  schema {
    query: Query
  }

  type Query {
    fetchNestedInt: [[Int]]
    fetchNestedObj: [[Order]]
    fetchNestedScalar: [[Date]]
    fetchNestedEnum: [[FetchType]]
    fetchNestedInterface: [[List]]
    fetchNestedUnion: [[SearchResult]]
  }

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
`

const date = new Date()

const { mockDocument } = buildMocking<any, any, any, true>(schema, {}, { mocks: { Date: date } })

describe('nested lists', () => {
  describe('possible to resolve nested list of', () => {
    it('integers', () => {
      const { data, errors } = mockDocument<any>('{ fetchNestedInt }')

      expect(errors).toBeFalsy()
      expect(data?.fetchNestedInt).toHaveLength(2)
      expect(data?.fetchNestedInt[0]).toHaveLength(2)
      expect(data?.fetchNestedInt[1]).toHaveLength(2)
      expect(data?.fetchNestedInt[1][0]).toBe(42)
    })

    it('objects', () => {
      const { data, errors } = mockDocument<any>('{ fetchNestedObj { id, date } }')

      expect(errors).toBeFalsy()
      expect(data?.fetchNestedObj).toHaveLength(2)
      expect(data?.fetchNestedObj[0]).toHaveLength(2)
      expect(data?.fetchNestedObj[1]).toHaveLength(2)
      expect(data?.fetchNestedObj[1][0]).toHaveProperty('id')
      expect(data?.fetchNestedObj[1][0]).toHaveProperty('date')
    })

    it('custom scalars', () => {
      const { data, errors } = mockDocument<any>('{ fetchNestedScalar }')
      expect(errors).toBeFalsy()
      expect(data?.fetchNestedScalar).toHaveLength(2)
      expect(data?.fetchNestedScalar[0]).toHaveLength(2)
      expect(data?.fetchNestedScalar[1]).toHaveLength(2)
      expect(data?.fetchNestedScalar[1][0]).toBeInstanceOf(Date)
    })

    it('enums', () => {
      const { data, errors } = mockDocument<any>('{ fetchNestedEnum }')
      expect(errors).toBeFalsy()
      expect(data?.fetchNestedEnum).toHaveLength(2)
      expect(data?.fetchNestedEnum[0]).toHaveLength(2)
      expect(data?.fetchNestedEnum[1]).toHaveLength(2)
      expect(data?.fetchNestedEnum[1][0]).toBe('NEW')
    })

    it('interfaces', () => {
      let toggle = 0
      const { data, errors } = mockDocument<any>(
        /* GraphQL */ `
          {
            fetchNestedInterface {
              total
              ... on DistributorList {
                distributors
              }
              ... on ProductIdsList {
                ids
              }
            }
          }
        `,
        {
          mocks: {
            List: () =>
              toggle++ % 2 == 0 ? { __typename: 'DistributorList' } : { __typename: 'ProductIdsList' },
          },
        }
      )
      expect(errors).toBeFalsy()
      expect(data?.fetchNestedInterface).toHaveLength(2)
      expect(data?.fetchNestedInterface[0]).toHaveLength(2)
      expect(data?.fetchNestedInterface[1]).toHaveLength(2)

      expect(data?.fetchNestedInterface[1][0]).toEqual({
        total: 42,
        distributors: ['Hello World', 'Hello World'],
        __typename: 'DistributorList',
      })

      expect(data?.fetchNestedInterface[0][1]).toEqual({
        total: 42,
        ids: [42, 42],
        __typename: 'ProductIdsList',
      })
    })
    it('unions', () => {
      let toggle = 0

      const { data, errors } = mockDocument<any>(
        /* GraphQL */ `
          {
            fetchNestedUnion {
              ... on Product {
                id
                name
              }
              ... on Order {
                id
                date
              }
            }
          }
        `,
        {
          mocks: {
            SearchResult: () => (toggle++ % 2 == 0 ? { __typename: 'Product' } : { __typename: 'Order' }),
          },
        }
      )

      expect(errors).toBeFalsy()
      expect(data?.fetchNestedUnion).toHaveLength(2)
      expect(data?.fetchNestedUnion[0]).toHaveLength(2)
      expect(data?.fetchNestedUnion[1]).toHaveLength(2)

      expect(data?.fetchNestedUnion[1][0]).toEqual({ id: 42, name: 'Hello World', __typename: 'Product' })
      expect(data?.fetchNestedUnion[0][1]).toEqual({ id: 42, __typename: 'Order', date: date })
    })
  })

  describe('preserving passed properties', () => {
    it('', () => {
      const { data, errors } = mockDocument<any>('{ fetchNestedObj { id, date } }', {
        mocks: { Query: { fetchNestedObj: [undefined] } },
      })

      expect(errors).toBeFalsy()
      expect(data?.fetchNestedObj).toHaveLength(1)
      expect(data?.fetchNestedObj[0]).toHaveLength(2)
    })
  })

  describe('error flows', () => {
    it('throws error if array is expected', () => {
      const { errors } = mockDocument<any>('{ fetchNestedObj { id, date } }', {
        mocks: { Query: { fetchNestedObj: [undefined, { id: 15 }] } },
      })

      expect(errors?.[0]?.message).toBe(
        'expected item of list type at path fetchNestedObj.1, found {"id":15}'
      )
    })

    it('throws error if object is expected', () => {
      const { errors } = mockDocument<any>('{ fetchNestedObj { id, date } }', {
        mocks: { Query: { fetchNestedObj: [null, [null, []]] } },
      })

      expect(errors?.[0]?.message).toBe('expected item of object type at path fetchNestedObj.1.1, found []')
    })
  })
})
