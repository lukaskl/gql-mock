import { OperationsMap } from './generated/operationsMap'

type KeysObj<T extends {}> = { [key in keyof T]: null }

export const operationsKeys: KeysObj<OperationsMap> = {
  Comment: null,
  CurrentUserForProfile: null,
  Feed: null,
  onCommentAdded: null,
  submitComment: null,
  submitRepository: null,
  vote: null,
}

{
  const assertOperationTypename = <T extends keyof OperationsMap>(
    typename: OperationsMap[T]['operationType']['__typename']
  ) => {}

  assertOperationTypename<'Comment'>('Query')
  assertOperationTypename<'submitRepository'>('Mutation')
  assertOperationTypename<'onCommentAdded'>('Subscription')
}

{
  const assertVariableNameExists = <T extends keyof OperationsMap>(
    variable: keyof OperationsMap[T]['variablesType']
  ) => {}

  assertVariableNameExists<'Comment'>('limit')
  assertVariableNameExists<'submitRepository'>('repoFullName')
  assertVariableNameExists<'onCommentAdded'>('repoFullName')
}

{
  const assertOperationKind = <T extends keyof OperationsMap>(
    kind: OperationsMap[T]['kind']
  ) => {}

  assertOperationKind<'Comment'>('Query')
  assertOperationKind<'submitRepository'>('Mutation')
  assertOperationKind<'onCommentAdded'>('Subscription')
}

{
  const assertUsedType = <T extends keyof OperationsMap>(
    type: keyof OperationsMap[T]['typeUsages']
  ) => {}

  assertUsedType<'Comment'>('User')
  assertUsedType<'submitComment'>('User')
  assertUsedType<'onCommentAdded'>('Comment')
}
