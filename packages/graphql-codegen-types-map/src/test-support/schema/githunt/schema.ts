import { buildSchema } from 'graphql'

export const schema = buildSchema(/* GraphQL */ `
  scalar Date

  # A comment about an entry, submitted by a user
  type Comment {
    # The SQL ID of this entry
    id: Int!

    # The GitHub user who posted the comment
    postedBy: User!

    # A timestamp of when the comment was posted
    createdAt: Date!

    # The text of the comment
    content: String!

    # The repository which this comment is about
    repoName: String!
  }

  # Information about a GitHub repository submitted to GitHunt
  type Entry {
    # Information about the repository from GitHub
    repository: Repository!

    # The GitHub user who submitted this entry
    postedBy: User!

    # A timestamp of when the entry was submitted
    createdAt: Date!

    # The score of this repository, upvotes - downvotes
    score: Int!

    # The hot score of this repository
    hotScore: Float!

    # Comments posted about this repository
    comments(limit: Int, offset: Int): [Comment]!

    # The number of comments posted about this repository
    commentCount: Int!

    # The SQL ID of this entry
    id: Int!

    # XXX to be changed
    vote: Vote!

    type: FeedType!
  }

  # A list of options for the sort order of the feed
  enum FeedType {
    # Sort by a combination of freshness and score, using Reddit's algorithm
    HOT

    # Newest entries first
    NEW

    # Highest score entries first
    TOP
  }

  input VoteArgs {
    # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
    repoFullName: String!

    # The type of vote - UP, DOWN, or CANCEL
    type: VoteType!
  }

  type Mutation {
    # Submit a new repository, returns the new submission
    submitRepository(
      # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
      repoFullName: String!
    ): Entry

    # Vote on a repository submission, returns the submission that was voted on
    vote(args: VoteArgs!): Entry

    # Comment on a repository, returns the new comment
    submitComment(
      # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
      repoFullName: String!

      # The text content for the new comment
      commentContent: String!
    ): Comment
  }

  union Followable = Organization | Repository

  type Query {
    followSuggestion: Followable

    # A feed of repository submissions
    feed(
      # The sort order for the feed
      type: FeedType = TOP

      # The number of items to skip, for pagination
      offset: Int

      # The number of items to fetch starting from the offset, for pagination
      limit: Int
    ): [Entry]

    # A single entry
    entry(
      # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
      repoFullName: String!
    ): Entry

    # A single entry
    repository(
      # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
      repoFullName: String!
    ): Repository

    # Return the currently logged in user, or null if nobody is logged in
    currentUser: User
  }

  # A repository object from the GitHub API. This uses the exact field names returned by the
  # GitHub API for simplicity, even though the convention for GraphQL is usually to camel case.
  type Repository {
    # Just the name of the repository, e.g. GitHunt-API
    name: String!

    # The full name of the repository with the username, e.g. apollostack/GitHunt-API
    fullName: String!

    # The description of the repository
    description: String

    # The link to the repository on GitHub
    htmlUrl: String!

    # The number of people who have starred this repository on GitHub
    stargazersCount: Int!

    # The number of open issues on this repository on GitHub
    openIssuesCount: Int

    # The owner of this repository on GitHub, e.g. apollostack
    owner: Actor!

    contributors: [Actor]
  }

  type Subscription {
    # Subscription fires on every comment added
    commentAdded(repoFullName: String!): Comment
  }

  interface Actor {
    # The URL to a directly embeddable image for this actor's avatar
    avatarUrl: String!

    # Display name of the actor
    name: String!
  }

  # A user object from the GitHub API. This uses the exact field names returned from the GitHub API.
  type User implements Actor {
    # The name of the user, e.g. apollostack
    login: String!

    # The URL to a directly embeddable image for this user's avatar
    avatarUrl: String!

    # The URL of this user's GitHub page
    htmlUrl: String!

    # Display name of the User
    name: String!
  }

  type Organization implements Actor {
    # The URL to a directly embeddable image for this organizations' avatar
    avatarUrl: String!

    # Display name of the actor
    name: String!

    # The URL of this organization's website page
    websiteUrl: String
  }

  # XXX to be removed
  type Vote {
    voteValue: Int!
  }

  # The type of vote to record, when submitting a vote
  enum VoteType {
    UP
    DOWN
    CANCEL
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`)
