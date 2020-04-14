/* eslint-disable */
import gql from 'graphql-tag'
export type Maybe<T> = T | null

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  Date: any
}

export type Actor = {
  /** The URL to a directly embeddable image for this actor's avatar */
  avatarUrl: Scalars['String']
  /** Display name of the actor */
  name: Scalars['String']
}

/** A comment about an entry, submitted by a user */
export type Comment = {
  __typename: 'Comment'
  /** The SQL ID of this entry */
  id: Scalars['Int']
  /** The GitHub user who posted the comment */
  postedBy: User
  /** A timestamp of when the comment was posted */
  createdAt: Scalars['Date']
  /** The text of the comment */
  content: Scalars['String']
  /** The repository which this comment is about */
  repoName: Scalars['String']
}

/** Information about a GitHub repository submitted to GitHunt */
export type Entry = {
  __typename: 'Entry'
  /** Information about the repository from GitHub */
  repository: Repository
  /** The GitHub user who submitted this entry */
  postedBy: User
  /** A timestamp of when the entry was submitted */
  createdAt: Scalars['Date']
  /** The score of this repository, upvotes - downvotes */
  score: Scalars['Int']
  /** The hot score of this repository */
  hotScore: Scalars['Float']
  /** Comments posted about this repository */
  comments: Array<Maybe<Comment>>
  /** The number of comments posted about this repository */
  commentCount: Scalars['Int']
  /** The SQL ID of this entry */
  id: Scalars['Int']
  /** XXX to be changed */
  vote: Vote
  type: FeedType
}

/** Information about a GitHub repository submitted to GitHunt */
export type EntryCommentsArgs = {
  limit: Maybe<Scalars['Int']>
  offset: Maybe<Scalars['Int']>
}

/** A list of options for the sort order of the feed */
export type FeedType =
  /** Sort by a combination of freshness and score, using Reddit's algorithm */
  | 'HOT'
  /** Newest entries first */
  | 'NEW'
  /** Highest score entries first */
  | 'TOP'

export type Followable = Organization | Repository

export type Mutation = {
  __typename: 'Mutation'
  /** Submit a new repository, returns the new submission */
  submitRepository: Maybe<Entry>
  /** Vote on a repository submission, returns the submission that was voted on */
  vote: Maybe<Entry>
  /** Comment on a repository, returns the new comment */
  submitComment: Maybe<Comment>
}

export type MutationSubmitRepositoryArgs = {
  repoFullName: Scalars['String']
}

export type MutationVoteArgs = {
  args: VoteArgs
}

export type MutationSubmitCommentArgs = {
  repoFullName: Scalars['String']
  commentContent: Scalars['String']
}

export type Organization = Actor & {
  __typename: 'Organization'
  /** The URL to a directly embeddable image for this organizations' avatar */
  avatarUrl: Scalars['String']
  /** Display name of the actor */
  name: Scalars['String']
  /** The URL of this organization's website page */
  websiteUrl: Maybe<Scalars['String']>
}

export type Query = {
  __typename: 'Query'
  followSuggestion: Maybe<Followable>
  latestErrorCodes: Maybe<Array<Maybe<Scalars['Int']>>>
  possibleFeedTypes: Maybe<Array<Maybe<FeedType>>>
  /** A feed of repository submissions */
  feed: Maybe<Array<Maybe<Entry>>>
  /** A single entry */
  entry: Maybe<Entry>
  /** A single entry */
  repository: Maybe<Repository>
  /** Return the currently logged in user, or null if nobody is logged in */
  currentUser: Maybe<User>
}

export type QueryFeedArgs = {
  type?: Maybe<FeedType>
  offset: Maybe<Scalars['Int']>
  limit: Maybe<Scalars['Int']>
}

export type QueryEntryArgs = {
  repoFullName: Scalars['String']
}

export type QueryRepositoryArgs = {
  repoFullName: Scalars['String']
}

/**
 * A repository object from the GitHub API. This uses the exact field names returned by the
 * GitHub API for simplicity, even though the convention for GraphQL is usually to camel case.
 */
export type Repository = {
  __typename: 'Repository'
  /** Just the name of the repository, e.g. GitHunt-API */
  name: Scalars['String']
  /** The full name of the repository with the username, e.g. apollostack/GitHunt-API */
  fullName: Scalars['String']
  /** The description of the repository */
  description: Maybe<Scalars['String']>
  /** The link to the repository on GitHub */
  htmlUrl: Scalars['String']
  /** The number of people who have starred this repository on GitHub */
  stargazersCount: Scalars['Int']
  /** The number of open issues on this repository on GitHub */
  openIssuesCount: Maybe<Scalars['Int']>
  /** The owner of this repository on GitHub, e.g. apollostack */
  owner: Actor
  contributors: Maybe<Array<Maybe<Actor>>>
}

export type Subscription = {
  __typename: 'Subscription'
  /** Subscription fires on every comment added */
  commentAdded: Maybe<Comment>
}

export type SubscriptionCommentAddedArgs = {
  repoFullName: Scalars['String']
}

/** A user object from the GitHub API. This uses the exact field names returned from the GitHub API. */
export type User = Actor & {
  __typename: 'User'
  /** The name of the user, e.g. apollostack */
  login: Scalars['String']
  /** The URL to a directly embeddable image for this user's avatar */
  avatarUrl: Scalars['String']
  /** The URL of this user's GitHub page */
  htmlUrl: Scalars['String']
  /** Display name of the User */
  name: Scalars['String']
}

/** XXX to be removed */
export type Vote = {
  __typename: 'Vote'
  voteValue: Scalars['Int']
}

export type VoteArgs = {
  /** The full repository name from GitHub, e.g. "apollostack/GitHunt-API" */
  repoFullName: Scalars['String']
  /** The type of vote - UP, DOWN, or CANCEL */
  type: VoteType
}

/** The type of vote to record, when submitting a vote */
export type VoteType = 'UP' | 'DOWN' | 'CANCEL'

export type OnCommentAddedSubscriptionVariables = {
  repoFullName: Scalars['String']
}

export type OnCommentAddedSubscription = { __typename: 'Subscription' } & {
  commentAdded?: Maybe<
    { __typename: 'Comment' } & Pick<Comment, 'id' | 'createdAt' | 'content'> & {
        postedBy: { __typename: 'User' } & Pick<User, 'login' | 'htmlUrl'>
      }
  >
}

export type CommentQueryVariables = {
  repoFullName: Scalars['String']
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
}

export type CommentQuery = { __typename: 'Query' } & {
  currentUser?: Maybe<{ __typename: 'User' } & Pick<User, 'login' | 'htmlUrl'>>
  entry?: Maybe<
    { __typename: 'Entry' } & Pick<Entry, 'id' | 'createdAt' | 'commentCount'> & {
        postedBy: { __typename: 'User' } & Pick<User, 'login' | 'htmlUrl'>
        comments: Array<Maybe<{ __typename: 'Comment' } & CommentsPageCommentFragment>>
        comments2: Array<Maybe<{ __typename: 'Comment' } & CommentsPageCommentFragment>>
        comments3: Array<Maybe<{ __typename: 'Comment' } & CommentsPageCommentFragment>>
        repository: { __typename: 'Repository' } & Pick<
          Repository,
          'description' | 'openIssuesCount' | 'stargazersCount' | 'fullName' | 'htmlUrl'
        >
      }
  >
}

export type CommentsPageCommentFragment = { __typename: 'Comment' } & Pick<
  Comment,
  'id' | 'createdAt' | 'content'
> & { postedBy: { __typename: 'User' } & Pick<User, 'login' | 'htmlUrl'> }

export type CurrentUserForProfileQueryVariables = {}

export type CurrentUserForProfileQuery = { __typename: 'Query' } & {
  currentUser?: Maybe<{ __typename: 'User' } & Pick<User, 'login' | 'avatarUrl'>>
}

export type FeedEntryFragment = { __typename: 'Entry' } & Pick<Entry, 'id' | 'commentCount'> & {
    repository: { __typename: 'Repository' } & Pick<Repository, 'fullName' | 'htmlUrl'> & {
        owner:
          | ({ __typename: 'Organization' } & Pick<Organization, 'avatarUrl'>)
          | ({ __typename: 'User' } & Pick<User, 'avatarUrl'>)
      }
  } & VoteButtonsFragment &
  RepoInfoFragment

export type FeedQueryVariables = {
  type: FeedType
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
}

export type FeedQuery = { __typename: 'Query' } & {
  currentUser?: Maybe<{ __typename: 'User' } & Pick<User, 'login'>>
  feed?: Maybe<Array<Maybe<{ __typename: 'Entry' } & FeedEntryFragment>>>
}

export type GetExtendedFollowSuggestionsQueryVariables = {}

export type GetExtendedFollowSuggestionsQuery = { __typename: 'Query' } & {
  followSuggestion?: Maybe<
    | ({ __typename: 'Organization' } & Pick<Organization, 'avatarUrl' | 'name' | 'websiteUrl'>)
    | ({ __typename: 'Repository' } & Pick<Repository, 'name' | 'htmlUrl'> & {
          contributors?: Maybe<
            Array<
              Maybe<
                | ({ __typename: 'Organization' } & Pick<Organization, 'websiteUrl' | 'avatarUrl' | 'name'>)
                | ({ __typename: 'User' } & Pick<User, 'htmlUrl' | 'login' | 'avatarUrl' | 'name'>)
              >
            >
          >
        })
  >
}

export type GetSimpleFollowSuggestionsQueryVariables = {}

export type GetSimpleFollowSuggestionsQuery = { __typename: 'Query' } & {
  followSuggestion?: Maybe<
    | ({ __typename: 'Organization' } & Pick<Organization, 'avatarUrl' | 'name' | 'websiteUrl'>)
    | ({ __typename: 'Repository' } & Pick<Repository, 'name' | 'htmlUrl'>)
  >
}

export type SubmitRepositoryMutationVariables = {
  repoFullName: Scalars['String']
}

export type SubmitRepositoryMutation = { __typename: 'Mutation' } & {
  submitRepository?: Maybe<{ __typename: 'Entry' } & Pick<Entry, 'createdAt'>>
}

export type RepoInfoFragment = { __typename: 'Entry' } & Pick<Entry, 'createdAt'> & {
    repository: { __typename: 'Repository' } & Pick<
      Repository,
      'description' | 'stargazersCount' | 'openIssuesCount'
    >
    postedBy: { __typename: 'User' } & Pick<User, 'htmlUrl' | 'login'>
  }

export type GetRepositoryContributorsQueryVariables = {
  repoFullName: Scalars['String']
}

export type GetRepositoryContributorsQuery = { __typename: 'Query' } & {
  repository?: Maybe<
    { __typename: 'Repository' } & Pick<Repository, 'name' | 'fullName'> & {
        owner:
          | ({ __typename: 'Organization' } & Pick<Organization, 'avatarUrl' | 'name'>)
          | ({ __typename: 'User' } & Pick<User, 'htmlUrl' | 'avatarUrl' | 'name'>)
        contributors?: Maybe<
          Array<
            Maybe<
              | ({ __typename: 'Organization' } & Pick<Organization, 'websiteUrl' | 'avatarUrl' | 'name'>)
              | ({ __typename: 'User' } & Pick<User, 'htmlUrl' | 'login' | 'avatarUrl' | 'name'>)
            >
          >
        >
      }
  >
}

export type GetListOfScalarsQueryVariables = {}

export type GetListOfScalarsQuery = { __typename: 'Query' } & Pick<Query, 'latestErrorCodes'>

export type GetListOfEnumsQueryVariables = {}

export type GetListOfEnumsQuery = { __typename: 'Query' } & Pick<Query, 'possibleFeedTypes'>

export type SubmitCommentMutationVariables = {
  repoFullName: Scalars['String']
  commentContent: Scalars['String']
}

export type SubmitCommentMutation = { __typename: 'Mutation' } & {
  submitComment?: Maybe<{ __typename: 'Comment' } & CommentsPageCommentFragment>
}

export type VoteButtonsFragment = { __typename: 'Entry' } & Pick<Entry, 'score'> & {
    vote: { __typename: 'Vote' } & Pick<Vote, 'voteValue'>
  }

export type VoteMutationVariables = {
  args: VoteArgs
}

export type VoteMutation = { __typename: 'Mutation' } & {
  vote?: Maybe<
    { __typename: 'Entry' } & Pick<Entry, 'score' | 'id'> & {
        vote: { __typename: 'Vote' } & Pick<Vote, 'voteValue'>
      }
  >
}

export const CommentsPageComment = gql`
  fragment CommentsPageComment on Comment {
    id
    postedBy {
      login
      htmlUrl
    }
    createdAt
    content
  }
`
export const VoteButtons = gql`
  fragment VoteButtons on Entry {
    score
    vote {
      voteValue
    }
  }
`
export const RepoInfo = gql`
  fragment RepoInfo on Entry {
    createdAt
    repository {
      description
      stargazersCount
      openIssuesCount
    }
    postedBy {
      htmlUrl
      login
    }
  }
`
export const FeedEntry = gql`
  fragment FeedEntry on Entry {
    id
    commentCount
    repository {
      fullName
      htmlUrl
      owner {
        avatarUrl
      }
    }
    ...VoteButtons
    ...RepoInfo
  }
  ${VoteButtons}
  ${RepoInfo}
`
export const OnCommentAdded = gql`
  subscription onCommentAdded($repoFullName: String!) {
    commentAdded(repoFullName: $repoFullName) {
      id
      postedBy {
        login
        htmlUrl
      }
      createdAt
      content
    }
  }
`
export const Comment = gql`
  query Comment($repoFullName: String!, $limit: Int, $offset: Int) {
    currentUser {
      login
      htmlUrl
    }
    entry(repoFullName: $repoFullName) {
      id
      postedBy {
        login
        htmlUrl
      }
      createdAt
      comments(limit: $limit, offset: $offset) {
        ...CommentsPageComment
      }
      comments2: comments(limit: $limit, offset: $offset) {
        ... {
          ... {
            ...CommentsPageComment
          }
        }
      }
      comments3: comments(limit: $limit, offset: $offset) {
        ... {
          ... on Comment {
            ...CommentsPageComment
          }
        }
      }
      commentCount
      repository {
        fullName
        htmlUrl
        ... on Repository {
          description
          openIssuesCount
          stargazersCount
        }
      }
    }
  }
  ${CommentsPageComment}
`
export const CurrentUserForProfile = gql`
  query CurrentUserForProfile {
    currentUser {
      login
      avatarUrl
    }
  }
`
export const Feed = gql`
  query Feed($type: FeedType!, $offset: Int, $limit: Int) {
    currentUser {
      login
    }
    feed(type: $type, offset: $offset, limit: $limit) {
      ...FeedEntry
    }
  }
  ${FeedEntry}
`
export const GetExtendedFollowSuggestions = gql`
  query getExtendedFollowSuggestions {
    followSuggestion {
      ... on Organization {
        avatarUrl
        name
        websiteUrl
      }
      ... on Repository {
        name
        htmlUrl
        contributors {
          avatarUrl
          name
          ... on User {
            htmlUrl
            login
          }
          ... on Organization {
            websiteUrl
          }
        }
      }
    }
  }
`
export const GetSimpleFollowSuggestions = gql`
  query getSimpleFollowSuggestions {
    followSuggestion {
      ... on Organization {
        avatarUrl
        name
        websiteUrl
      }
      ... on Repository {
        name
        htmlUrl
      }
    }
  }
`
export const SubmitRepository = gql`
  mutation submitRepository($repoFullName: String!) {
    submitRepository(repoFullName: $repoFullName) {
      createdAt
    }
  }
`
export const GetRepositoryContributors = gql`
  query getRepositoryContributors($repoFullName: String!) {
    repository(repoFullName: $repoFullName) {
      name
      fullName
      owner {
        avatarUrl
        name
        ... on User {
          htmlUrl
        }
      }
      contributors {
        avatarUrl
        name
        ... on User {
          htmlUrl
          login
        }
        ... on Organization {
          websiteUrl
        }
      }
    }
  }
`
export const GetListOfScalars = gql`
  query getListOfScalars {
    latestErrorCodes
  }
`
export const GetListOfEnums = gql`
  query getListOfEnums {
    possibleFeedTypes
  }
`
export const SubmitComment = gql`
  mutation submitComment($repoFullName: String!, $commentContent: String!) {
    submitComment(repoFullName: $repoFullName, commentContent: $commentContent) {
      ...CommentsPageComment
    }
  }
  ${CommentsPageComment}
`
export const Vote = gql`
  mutation vote($args: VoteArgs!) {
    vote(args: $args) {
      score
      id
      vote {
        voteValue
      }
    }
  }
`
