import { buildSchema } from 'graphql'

export const schema = buildSchema(/* GraphQL */ `
  type Query {
    fetch(listType: String!, amount: Int!, offset: Int!): [List]
  }

  type Distributor {
    id: Int
    name: String
  }

  type Product {
    id: Int
    name: String
  }

  interface List {
    amount: Int
    offset: Int
    total: Int
    remaining: Int
  }

  type DistributorList implements List {
    amount: Int
    offset: Int
    total: Int
    remaining: Int
    items: [Distributor]
  }

  type ProductList implements List {
    amount: Int
    offset: Int
    total: Int
    remaining: Int
    items: [Product]
  }

  schema {
    query: Query
  }
`)
