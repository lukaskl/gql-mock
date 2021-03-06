import { buildMocking } from './buildMocking'
import { documentsMap, schemas, TypesMap } from '~/test-support/githunt'

const emptyArray = (length: number) => Array.from(Array(length)).map(() => ({}))

/**
 * TODOs:
 *  - [x] support passing array of mocks
 *  - [x] support enums
 *  - [x] support unions & interface
 *  - [x] correctly type ./mockFields.ts & ./buildMocking
 *
 * non essential additions:
 *  - [ ] support passing "preservePrevious"
 *  - [ ] support passing "addTypenames"
 *  - [ ] support passing raw query documents
 *  - [ ] generate typenames for interface types
 *  - [ ] support deeply nested arrays
 *  - [ ] support resolving fragments
 *  - [ ] support passing context
 *  - [ ] port tests from graphql-tools
 *  - [ ] clone GraphQLSchema (if passed) - (?) - as otherwise it gets altered
 *  - [ ] support async execution (?)
 */

describe('', () => {
  const { mock } = buildMocking<TypesMap>(schemas.typeDefs, documentsMap, {
    mocks: { Date: () => new Date(), Actor: { __typename: 'User' } },
  })

  describe('variations of passing the mocks', () => {
    it('possible to pass function Type resolver and function field resolver', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: () => ({ feed: (root, { limit }) => emptyArray(limit || 0) }) },
        variables: { type: 'TOP', limit: 3 },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed).toHaveLength(3)
      expect(data?.feed?.map(x => x?.__typename)).toEqual(['Entry', 'Entry', 'Entry'])
    })

    it('possible to pass function Type resolver and object field resolver', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: () => ({ feed: [{}, {}, {}] }) },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed).toHaveLength(3)
      expect(data?.feed?.map(x => x?.__typename)).toEqual(['Entry', 'Entry', 'Entry'])
    })

    it('possible to pass object Type resolver and function field resolver', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: { feed: (root, { limit }) => emptyArray(limit || 0) } },
        variables: { type: 'TOP', limit: 3 },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed).toHaveLength(3)
      expect(data?.feed?.map(x => x?.__typename)).toEqual(['Entry', 'Entry', 'Entry'])
    })

    it('possible to pass object Type resolver and object field resolver', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: { feed: [{}, {}, {}] } },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed).toHaveLength(3)
      expect(data?.feed?.map(x => x?.__typename)).toEqual(['Entry', 'Entry', 'Entry'])
    })
  })

  describe('resolvers invocation count', () => {
    it('resolver functions are invoked once per type passing function Type resolver and function Field resolver', () => {
      const fieldFn = jest.fn().mockReturnValue({})
      const entryTypeFn = jest.fn().mockReturnValue({ postedBy: fieldFn })

      const queryTypeFn = jest.fn().mockReturnValue({ feed: [{}, {}, {}] })

      const { errors } = mock('Feed', {
        mocks: { Query: queryTypeFn, Entry: entryTypeFn },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(queryTypeFn).toBeCalledTimes(1)
      expect(entryTypeFn).toBeCalledTimes(3)
      expect(fieldFn).toBeCalledTimes(3)
    })

    it('field resolver functions are invoked once per type passing object Type resolver and function field resolver', () => {
      const fieldFn = jest.fn().mockReturnValue({})

      const { errors } = mock('Feed', {
        mocks: { Query: { feed: [{}, {}, {}] }, Entry: { postedBy: fieldFn } },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(fieldFn).toBeCalledTimes(3)
    })
  })

  describe('array mocks', () => {
    it('null passed to array the mock resolves to null', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: { feed: [null] } },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed?.[0]).toBe(null)
    })

    it('empty object passed to the array mock resolves to object', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: { feed: [{}] } },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed?.[0]?.__typename).toBe('Entry')
    })

    it('undefined passed to the array mock resolves to object', () => {
      const { data, errors } = mock('Feed', {
        mocks: { Query: { feed: [undefined] } },
        variables: { type: 'TOP' },
      })

      expect(errors).toBeFalsy()
      expect(data?.feed?.[0]?.__typename).toBe('Entry')
    })

    it('possible to resolve list of scalars', () => {
      const { data, errors } = mock('getListOfScalars', {
        mocks: { Query: { latestErrorCodes: [undefined, null, 500] } },
      })

      expect(errors).toBeFalsy()
      expect(data?.latestErrorCodes).toHaveLength(3)
      expect(typeof data?.latestErrorCodes?.[0]).toBe('number')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(Math.trunc(data?.latestErrorCodes?.[0]!)).toBeCloseTo(data?.latestErrorCodes?.[0]!, 4)
      expect(data?.latestErrorCodes?.[1]).toBe(null)
      expect(data?.latestErrorCodes?.[2]).toBe(500)
    })

    it('possible to resolve list of enums', () => {
      const { data, errors } = mock('getListOfEnums', {
        mocks: { Query: { possibleFeedTypes: ['NEW', undefined, null] } },
      })

      expect(errors).toBeFalsy()
      expect(data?.possibleFeedTypes).toHaveLength(3)
      expect(data?.possibleFeedTypes?.[0]).toBe('NEW')
      expect(data?.possibleFeedTypes?.[1]).toBe('HOT')
      expect(data?.possibleFeedTypes?.[2]).toBe(null)
    })
  })

  it('mock Feed query', () => {
    const { data, errors } = mock('Feed', {
      mocks: {
        User: { login: 'fake-login' },
        Query: { feed: [{}, {}, null, {}] },
      },
      variables: { type: 'HOT' },
    })

    expect(errors).toBeFalsy()
    expect(data?.currentUser?.login).toBe('fake-login')
    expect(data?.feed?.[0]?.postedBy).toBeTruthy()
    expect(data?.feed?.[0]?.commentCount).toBeTruthy()
  })

  it('mock Feed query with null scalars', () => {
    const { data, errors } = mock('Feed', {
      mocks: {
        Query: { feed: [{}] },
        Repository: {
          openIssuesCount: null,
          description: null,
        },
      },
      variables: { type: 'HOT' },
    })

    expect(errors).toBeFalsy()
    expect(data?.feed?.[0]?.repository.openIssuesCount).toBe(null)
    expect(data?.feed?.[0]?.repository.description).toBe(null)
  })

  it('mock Comment query', () => {
    const { data, errors } = mock('Comment', {
      mocks: {
        User: { login: 'fake-User.login', htmlUrl: 'fake-User.html_url' },
        Entry: {
          comments: [{ postedBy: { htmlUrl: 'fake-Entry.comments.0.postedBy.html-url' } }, {}],
          comments2: [],
          comments3: [],
        },
        Comment: {
          content: 'a',
          postedBy: { login: 'fake-Comment.postedBy.login', htmlUrl: 'fake-Comment.postedBy.html-url' },
        },
      },
      variables: { repoFullName: 'test' },
    })

    expect(errors).toBeFalsy()
    expect(data?.currentUser?.login).toBe('fake-User.login')
    expect(data?.currentUser?.htmlUrl).toBe('fake-User.html_url')

    expect(data?.entry?.comments[0]?.postedBy.login).toBe('fake-Comment.postedBy.login')
    expect(data?.entry?.comments[0]?.postedBy.htmlUrl).toBe('fake-Entry.comments.0.postedBy.html-url')

    expect(data?.entry?.comments[1]?.postedBy.login).toBe('fake-Comment.postedBy.login')
    expect(data?.entry?.comments[1]?.postedBy.htmlUrl).toBe('fake-Comment.postedBy.html-url')
  })
})

describe('mocking abstract types', () => {
  const { mock } = buildMocking<TypesMap>(schemas.typeDefs, documentsMap, {
    mocks: { Date: () => new Date() },
  })
  it('possible to resolve list of unions', () => {
    const { data, errors } = mock('getSimpleFollowSuggestions', {
      mocks: {
        Query: { followSuggestions: [{ __typename: 'Repository' }, {}, null, undefined] },
        Followable: { __typename: 'Organization' },
      },
    })

    expect(errors).toBeFalsy()
    expect(data?.followSuggestions?.[0]).toMatchObject({ htmlUrl: 'Hello World', __typename: 'Repository' })
    expect(data?.followSuggestions?.[1]).toMatchObject({
      websiteUrl: 'Hello World',
      __typename: 'Organization',
    })
    expect(data?.followSuggestions?.[2]).toBe(null)
    expect(data?.followSuggestions?.[3]).toMatchObject({
      websiteUrl: 'Hello World',
      __typename: 'Organization',
    })
  })
  it('resolving list of unions returns an error if no __typename fields are passed', () => {
    const { errors } = mock('getSimpleFollowSuggestions', {
      mocks: { Query: { followSuggestions: [{ __typename: 'Repository' }, {}, null, undefined] } },
    })

    expect(errors?.[0].message).toBe(
      'A mock providing "__typename" property for type Followable is required, error at followSuggestions.1'
    )
    expect(errors).toHaveLength(1)
  })
  it('possible to resolve list of interfaces', () => {
    const { data, errors } = mock('getExtendedFollowSuggestion', {
      mocks: {
        Repository: { contributors: [{ __typename: 'Organization' }, {}, null, undefined] },
        Followable: { __typename: 'Repository' },
        Actor: { __typename: 'User' },
      },
    })

    expect(errors).toBeFalsy()
    const contributors =
      (data?.followSuggestion?.__typename === 'Repository' && data.followSuggestion.contributors) || []
    expect(contributors).toHaveLength(4)
    expect(contributors?.[0]).toMatchObject({ websiteUrl: 'Hello World', __typename: 'Organization' })
    expect(contributors?.[1]).toMatchObject({ login: 'Hello World', __typename: 'User' })
    expect(contributors?.[2]).toBe(null)
    expect(contributors?.[3]).toMatchObject({ login: 'Hello World', __typename: 'User' })
  })

  it('resolving list of interfaces returns an error if no __typename fields are passed', () => {
    const { errors } = mock('getExtendedFollowSuggestion', {
      mocks: {
        Repository: { contributors: [{ __typename: 'Organization' }, {}, null, undefined] },
        Followable: { __typename: 'Repository' },
      },
    })

    expect(errors?.[0].message).toBe(
      'A mock providing "__typename" property for type Actor is required, error at followSuggestion.contributors.1'
    )
    expect(errors).toHaveLength(1)
  })
})
