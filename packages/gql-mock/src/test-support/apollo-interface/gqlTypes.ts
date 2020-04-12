/* eslint-disable */
import gql from "graphql-tag";
export type Maybe<T> = T | null;

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Distributor = {
  __typename: "Distributor";
  id: Maybe<Scalars["Int"]>;
  name: Maybe<Scalars["String"]>;
};

export type DistributorList = List & {
  __typename: "DistributorList";
  amount: Maybe<Scalars["Int"]>;
  offset: Maybe<Scalars["Int"]>;
  total: Maybe<Scalars["Int"]>;
  remaining: Maybe<Scalars["Int"]>;
  items: Maybe<Array<Maybe<Distributor>>>;
};

export type List = {
  amount: Maybe<Scalars["Int"]>;
  offset: Maybe<Scalars["Int"]>;
  total: Maybe<Scalars["Int"]>;
  remaining: Maybe<Scalars["Int"]>;
};

export type Product = {
  __typename: "Product";
  id: Maybe<Scalars["Int"]>;
  name: Maybe<Scalars["String"]>;
};

export type ProductList = List & {
  __typename: "ProductList";
  amount: Maybe<Scalars["Int"]>;
  offset: Maybe<Scalars["Int"]>;
  total: Maybe<Scalars["Int"]>;
  remaining: Maybe<Scalars["Int"]>;
  items: Maybe<Array<Maybe<Product>>>;
};

export type Query = {
  __typename: "Query";
  fetch: Maybe<Array<Maybe<List>>>;
};

export type QueryFetchArgs = {
  listType: Scalars["String"];
  amount: Scalars["Int"];
  offset: Scalars["Int"];
};

export type FetchMoreQueryVariables = {};

export type FetchMoreQuery = { __typename: "Query" } & {
  fetch?: Maybe<
    Array<
      Maybe<
        | ({ __typename: "DistributorList" } & Pick<
            DistributorList,
            "amount" | "offset" | "total" | "remaining"
          >)
        | ({ __typename: "ProductList" } & Pick<
            ProductList,
            "amount" | "offset" | "total" | "remaining"
          >)
      >
    >
  >;
};

export const FetchMore = gql`
  query fetchMore {
    fetch(listType: "test", amount: 10, offset: 0) {
      amount
      offset
      total
      remaining
    }
  }
`;
