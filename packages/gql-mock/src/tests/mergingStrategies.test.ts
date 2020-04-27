import { buildMocking } from '~/mocking'
import { documentsMap, schemas, TypesMap } from '~/test-support/githunt'

const { mock } = buildMocking<TypesMap>(schemas.typeDefs, documentsMap, {
  mocks: { Date: () => new Date(), Actor: { __typename: 'User' } },
})

describe('mocks merging', () => {
  describe('preserve-shallow', () => {
    it('preserves closer to type value passed', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: {
          Comment: { postedBy: { htmlUrl: 'one' } },
          User: { htmlUrl: 'three' },
        },
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('three')
    })

    it('preserves closer to type value passed even if it was passed earlier', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: {
          User: { htmlUrl: 'three' },
          Comment: { postedBy: { htmlUrl: 'one' } },
        },
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('three')
    })

    it('preserves closer to type value passed in the different group of mocks', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: [
          {
            Comment: { postedBy: { htmlUrl: 'one' } },
          },
          {
            Comment: { postedBy: { htmlUrl: 'two' } },
            User: { htmlUrl: 'three' },
          },
        ],
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('three')
    })

    it('preserves closer to type value passed in the different group of mocks even if it was passed earlier', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: [
          {
            User: { htmlUrl: 'three' },
            Comment: { postedBy: { htmlUrl: 'one' } },
          },
          {
            Comment: { postedBy: { htmlUrl: 'two' } },
          },
        ],
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('three')
    })

    it('scalar values are overridden even preserve-shallow merging strategy is given', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: [
          {
            User: { htmlUrl: 'three' },
            Comment: { postedBy: { htmlUrl: 'one' } },
          },
          () => ({
            String: 'fake-string',
          }),
        ],
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('three')
      expect(data?.postedBy.login).toBe('fake-string')
      expect(data?.content).toBe('fake-string')
    })

    it('complex merging of deeper value mocks (preserve as close as possible to type)', () => {
      const { data, errors } = mock('Comment', {
        mocks: {
          User: { login: 'fake-User.login' },
          Entry: {
            comments: [{ postedBy: { htmlUrl: 'will-be-ignored' } }, {}],
          },
          Comment: {
            content: 'a',
            postedBy: { login: 'will-be-ignored', htmlUrl: 'fake-Comment.postedBy.html-url' },
          },
        },
        variables: { repoFullName: 'test' },
        mergingStrategy: 'preserve-shallow',
      })

      expect(errors).toBeFalsy()
      expect(data?.currentUser?.login).toBe('fake-User.login')
      expect(data?.currentUser?.htmlUrl).toBe('Hello World')

      expect(data?.entry?.comments[0]?.postedBy.login).toBe('fake-User.login')
      expect(data?.entry?.comments[0]?.postedBy.htmlUrl).toBe('fake-Comment.postedBy.html-url')

      expect(data?.entry?.comments[1]?.postedBy.login).toBe('fake-User.login')
      expect(data?.entry?.comments[1]?.postedBy.htmlUrl).toBe('fake-Comment.postedBy.html-url')
    })
  })

  describe('preserve-deeper', () => {
    it('preserves deeper value passed', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: {
          Comment: { postedBy: { htmlUrl: 'one' } },
          User: { htmlUrl: 'three' },
        },
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('one')
    })

    it('preserves deeper value passed even if it was passed earlier', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: {
          User: { htmlUrl: 'three' },
          Comment: { postedBy: { htmlUrl: 'one' } },
        },
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('one')
    })

    it('preserves deeper value passed in the different group of mocks', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: [
          {
            Comment: { postedBy: { htmlUrl: 'one' } },
          },
          {
            Comment: { postedBy: { htmlUrl: 'two' } },
            User: { htmlUrl: 'three' },
          },
        ],
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('two')
    })

    it('preserves deeper value passed in the different group of mocks even if it was passed earlier', () => {
      const { data, errors } = mock('CommentsPageComment', {
        mocks: [
          {
            User: { htmlUrl: 'three' },
            Comment: { postedBy: { htmlUrl: 'one' } },
          },
          {
            Comment: { postedBy: { htmlUrl: 'two' } },
          },
        ],
      })

      expect(errors).toBeFalsy()
      expect(data?.postedBy.htmlUrl).toBe('two')
    })

    it('complex merging of deeper value mocks', () => {
      const { data, errors } = mock('Comment', {
        mocks: {
          User: { login: 'fake-User.login', htmlUrl: 'fake-User.html_url' },
          Entry: {
            comments: [{ postedBy: { htmlUrl: 'fake-Entry.comments.0.postedBy.html-url' } }, {}],
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
})
