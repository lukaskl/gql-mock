/* eslint-disable @typescript-eslint/camelcase */
import { buildMocking } from './buildMocking'
import { documentsMap, schemas, TypesMap } from '~/test-support/githunt'

const { mock } = buildMocking<TypesMap>(schemas.builtSchema, documentsMap)

const emptyArray = (length: number) => Array.from(Array(length)).map(() => ({}))

describe('', () => {
  it('possible to use field arguments', () => {
    const { data } = mock('Feed', {
      mocks: { Query: { feed: (root, { limit }) => emptyArray(limit || 0) } },
      variables: { type: 'TOP', limit: 3 },
    })

    expect(data?.feed).toHaveLength(3)
  })

  it('null passed to array the mock resolves to null', () => {
    const { data } = mock('Feed', {
      mocks: { Query: { feed: [null] } },
      variables: { type: 'TOP' },
    })

    expect(data?.feed?.[0]).toBe(null)
  })

  it('empty object passed to the array mock resolves to object', () => {
    const { data } = mock('Feed', {
      mocks: { Query: { feed: [{}] } },
      variables: { type: 'TOP' },
    })

    expect(data?.feed?.[0]?.__typename).toBe('Entry')
  })

  it('undefined passed to the array mock resolves to object', () => {
    const { data } = mock('Feed', {
      mocks: { Query: { feed: [undefined] } },
      variables: { type: 'TOP' },
    })

    expect(data?.feed?.[0]?.__typename).toBe('Entry')
  })

  it('mock Feed query', () => {
    const { data } = mock('Feed', {
      mocks: {
        User: { login: 'fake-login' },
        Query: { feed: [{}, {}, null, {}] },
      },
      variables: { type: 'HOT' },
    })

    expect(data?.currentUser?.login).toBe('fake-login')
    expect(data?.feed?.[0]?.postedBy).toBeTruthy()
    expect(data?.feed?.[0]?.commentCount).toBeTruthy()
  })

  it('mock Comment query', () => {
    const { data, errors } = mock('Comment', {
      mocks: {
        User: { login: 'fake-User.login', html_url: 'fake-User.html_url' },
        Entry: {
          comments: [{ postedBy: { html_url: 'fake-Entry.comments.0.postedBy.html-url' } }, {}],
          comments2: [],
          comments3: [],
        },
        Comment: {
          content: 'a',
          postedBy: { login: 'fake-Comment.postedBy.login', html_url: 'fake-Comment.postedBy.html-url' },
        },
      },
      variables: { repoFullName: 'test' },
    })

    expect(errors).toBeFalsy()
    expect(data?.currentUser?.login).toBe('fake-User.login')
    expect(data?.currentUser?.html_url).toBe('fake-User.html_url')

    expect(data?.entry?.comments[0]?.postedBy.login).toBe('fake-Comment.postedBy.login')
    expect(data?.entry?.comments[0]?.postedBy.html_url).toBe('fake-Entry.comments.0.postedBy.html-url')

    expect(data?.entry?.comments[1]?.postedBy.login).toBe('fake-Comment.postedBy.login')
    expect(data?.entry?.comments[1]?.postedBy.html_url).toBe('fake-Comment.postedBy.html-url')
  })
})
