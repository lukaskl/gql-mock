import { GraphQLOutputType } from 'graphql'

/**
 * Type can have in total 6 possible states
 *
 * @example
 * e.g. let's say we have type User, then it can have
 *   - two type states (User and User!)
 *   - three array types (no-array, [], []!)
 *
 * enumerating variations that would be:
 *    User,  [User],  [User]!
 *    User!, [User!], [User!]!
 */
export interface FlattenTypeInfo {
  type: {
    name: string
    isNullable: boolean
  }
  array?: 'nullable' | 'non-nullable'
}

export const flattenTypeInfo = (type: GraphQLOutputType): FlattenTypeInfo => {
  // yes, it might be possible to use actual properties (or constructor names) of the GraphQLOutputType
  // to traverse the type, however doing this readability suffers much more than
  // using string operators

  const typeStr = type.inspect()
  const isArray = typeStr.includes(']')

  const array = isArray ? (typeStr.includes(']!') ? 'non-nullable' : 'nullable') : undefined

  const underlyingTypeStr = isArray
    ? typeStr
        // the order is important
        .replace(']!', '')
        .replace(']', '')
        .replace('[', '')
    : typeStr

  const isNullable = !underlyingTypeStr.endsWith('!')
  const typeName = underlyingTypeStr.replace('!', '')

  return {
    type: {
      name: typeName,
      isNullable,
    },
    array,
  }
}
