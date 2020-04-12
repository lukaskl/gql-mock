/* eslint-disable @typescript-eslint/camelcase */
import { buildMocking } from './buildMocking'
import { documentsMap, schemas, TypesMap } from '~/test-support/githunt'

const { mock } = buildMocking<TypesMap>(schemas.builtSchema, documentsMap)

describe( '', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  it('mock Feed query', () => {
    const { data } = mock('Feed', {
      mocks: {
        User: { login: 'fake-login' },
        // TODO: support this API in the future
        // Right now this is ignored and only 2
        // items are returned
        Query: { feed: [{}, {}, null, {}] as any },
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
          comments: [{ postedBy: { html_url: 'fake-Entry.comments.0.postedBy.html-url' } }, {}] as any,
          comments2: [] as any,
          comments3: [] as any,
        },
        Comment: {
          content: 'a',
          postedBy: { login: 'fake-Comment.postedBy.login', html_url: 'fake-Comment.postedBy.html-url' },
        } as any,
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
