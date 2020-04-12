/* eslint-disable */
import * as Types from './gqlTypes'
type NonNullable<T> = T extends null | undefined ? never : T
type NN<T> = NonNullable<T>
type UnwrapUnion<T, K> = T extends { __typename: K } ? T : never
type UU<T, K> = UnwrapUnion<T, K>

export interface FieldArgsUsagesMap {
  Query: {
    feed: Types.QueryFeedArgs
    entry: Types.QueryEntryArgs
  }
  Entry: {
    comments: Types.EntryCommentsArgs
  }
  Mutation: {
    submitRepository: Types.MutationSubmitRepositoryArgs
    vote: Types.MutationVoteArgs
    submitComment: Types.MutationSubmitCommentArgs
  }
  Subscription: {
    commentAdded: Types.SubscriptionCommentAddedArgs
  }
}

export type TypeUsagesForCommentsPageCommentFragment = {
  User: Types.CommentsPageCommentFragment['postedBy']
} & { Comment: Types.CommentsPageCommentFragment }

export type TypeUsagesForFeedEntryFragment = {
  Repository: Types.FeedEntryFragment['repository']
} & { User: Types.FeedEntryFragment['repository']['owner'] } & {
  Entry: Types.FeedEntryFragment
} & TypeUsagesForVoteButtonsFragment &
  TypeUsagesForRepoInfoFragment

export type TypeUsagesForRepoInfoFragment = {
  Repository: Types.RepoInfoFragment['repository']
} & { User: Types.RepoInfoFragment['postedBy'] } & {
  Entry: Types.RepoInfoFragment
}

export type TypeUsagesForVoteButtonsFragment = {
  Vote: Types.VoteButtonsFragment['vote']
} & { Entry: Types.VoteButtonsFragment }

export type TypeUsagesForOnCommentAddedSubscription = {
  Comment: Types.OnCommentAddedSubscription['commentAdded']
} & {
  User: NN<Types.OnCommentAddedSubscription['commentAdded']>['postedBy']
} & { Subscription: Types.OnCommentAddedSubscription }

export type TypeUsagesForCommentQuery = {
  User: Types.CommentQuery['currentUser']
} & { Entry: Types.CommentQuery['entry'] } & {
  User: NN<Types.CommentQuery['entry']>['postedBy']
} & { Comment: NN<Types.CommentQuery['entry']>['comments'][0] } & {
  Comment: NN<Types.CommentQuery['entry']>['comments2'][0]
} & { Comment: NN<Types.CommentQuery['entry']>['comments3'][0] } & {
  Comment: UU<NN<NN<Types.CommentQuery['entry']>['comments3'][0]>, 'Comment'>
} & { Repository: NN<Types.CommentQuery['entry']>['repository'] } & {
  Repository: UU<NN<Types.CommentQuery['entry']>['repository'], 'Repository'>
} & { Query: Types.CommentQuery } & TypeUsagesForCommentsPageCommentFragment

export type TypeUsagesForCurrentUserForProfileQuery = {
  User: Types.CurrentUserForProfileQuery['currentUser']
} & { Query: Types.CurrentUserForProfileQuery }

export type TypeUsagesForFeedQuery = {
  User: Types.FeedQuery['currentUser']
} & { Entry: NN<Types.FeedQuery['feed']>[0] } & {
  Query: Types.FeedQuery
} & TypeUsagesForFeedEntryFragment

export type TypeUsagesForSubmitRepositoryMutation = {
  Entry: Types.SubmitRepositoryMutation['submitRepository']
} & { Mutation: Types.SubmitRepositoryMutation }

export type TypeUsagesForSubmitCommentMutation = {
  Comment: Types.SubmitCommentMutation['submitComment']
} & {
  Mutation: Types.SubmitCommentMutation
} & TypeUsagesForCommentsPageCommentFragment

export type TypeUsagesForVoteMutation = {
  Entry: Types.VoteMutation['vote']
} & { Vote: NN<Types.VoteMutation['vote']>['vote'] } & {
  Mutation: Types.VoteMutation
}

export interface OperationsMap {
  CommentsPageComment: {
    operationType: Types.CommentsPageCommentFragment
    variablesType: {}
    typeUsages: TypeUsagesForCommentsPageCommentFragment
    kind: 'fragment'
  }
  FeedEntry: {
    operationType: Types.FeedEntryFragment
    variablesType: {}
    typeUsages: TypeUsagesForFeedEntryFragment
    kind: 'fragment'
  }
  RepoInfo: {
    operationType: Types.RepoInfoFragment
    variablesType: {}
    typeUsages: TypeUsagesForRepoInfoFragment
    kind: 'fragment'
  }
  VoteButtons: {
    operationType: Types.VoteButtonsFragment
    variablesType: {}
    typeUsages: TypeUsagesForVoteButtonsFragment
    kind: 'fragment'
  }
  onCommentAdded: {
    operationType: Types.OnCommentAddedSubscription
    variablesType: Types.OnCommentAddedSubscriptionVariables
    typeUsages: TypeUsagesForOnCommentAddedSubscription
    kind: 'subscription'
  }
  Comment: {
    operationType: Types.CommentQuery
    variablesType: Types.CommentQueryVariables
    typeUsages: TypeUsagesForCommentQuery
    kind: 'query'
  }
  CurrentUserForProfile: {
    operationType: Types.CurrentUserForProfileQuery
    variablesType: Types.CurrentUserForProfileQueryVariables
    typeUsages: TypeUsagesForCurrentUserForProfileQuery
    kind: 'query'
  }
  Feed: {
    operationType: Types.FeedQuery
    variablesType: Types.FeedQueryVariables
    typeUsages: TypeUsagesForFeedQuery
    kind: 'query'
  }
  submitRepository: {
    operationType: Types.SubmitRepositoryMutation
    variablesType: Types.SubmitRepositoryMutationVariables
    typeUsages: TypeUsagesForSubmitRepositoryMutation
    kind: 'mutation'
  }
  submitComment: {
    operationType: Types.SubmitCommentMutation
    variablesType: Types.SubmitCommentMutationVariables
    typeUsages: TypeUsagesForSubmitCommentMutation
    kind: 'mutation'
  }
  vote: {
    operationType: Types.VoteMutation
    variablesType: Types.VoteMutationVariables
    typeUsages: TypeUsagesForVoteMutation
    kind: 'mutation'
  }
}

export interface TypesMap {
  operations: OperationsMap
  fieldArgsUsages: FieldArgsUsagesMap
}

export const documentsMap = {
  CommentsPageComment: {
    document: Types.CommentsPageComment,
    kind: 'fragment' as const,
  },
  FeedEntry: { document: Types.FeedEntry, kind: 'fragment' as const },
  RepoInfo: { document: Types.RepoInfo, kind: 'fragment' as const },
  VoteButtons: { document: Types.VoteButtons, kind: 'fragment' as const },
  onCommentAdded: {
    document: Types.OnCommentAdded,
    kind: 'subscription' as const,
  },
  Comment: { document: Types.Comment, kind: 'query' as const },
  CurrentUserForProfile: {
    document: Types.CurrentUserForProfile,
    kind: 'query' as const,
  },
  Feed: { document: Types.Feed, kind: 'query' as const },
  submitRepository: {
    document: Types.SubmitRepository,
    kind: 'mutation' as const,
  },
  submitComment: { document: Types.SubmitComment, kind: 'mutation' as const },
  vote: { document: Types.Vote, kind: 'mutation' as const },
}
