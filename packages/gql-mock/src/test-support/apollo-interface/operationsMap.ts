/* eslint-disable */
import * as Types from "./gqlTypes";
type NonNullable<T> = T extends null | undefined ? never : T;
type NN<T> = NonNullable<T>;
type UnwrapUnion<T, K> = T extends { __typename: K } ? T : never;
type UU<T, K> = UnwrapUnion<T, K>;

export interface FieldArgsUsagesMap {
  Query: {
    fetch: Types.QueryFetchArgs;
  };
}

export type TypeUsagesForFetchMoreQuery = {
  List: NN<Types.FetchMoreQuery["fetch"]>[0];
} & { Query: Types.FetchMoreQuery };

export interface OperationsMap {
  fetchMore: {
    operationType: Types.FetchMoreQuery;
    variablesType: Types.FetchMoreQueryVariables;
    typeUsages: TypeUsagesForFetchMoreQuery;
    kind: "query";
  };
}

export interface TypesMap {
  operations: OperationsMap;
  fieldArgsUsages: FieldArgsUsagesMap;
}

export const documentsMap = {
  fetchMore: { document: Types.FetchMore, kind: "query" as const }
};
