import { buildMocking } from './buildMocking'
import { documentsMap, schemas, TypesMap } from '~/test-support/githunt'

const { mock } = buildMocking<TypesMap>(schemas.builtSchema, documentsMap)

describe('', () => {
  it('', () => {
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
})
