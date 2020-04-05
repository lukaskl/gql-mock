import merge from 'lodash.merge'

export type KeysObj<T extends string> = { [key in T]: null }

export const unionToArray = <T extends string>(obj: KeysObj<T>) => {
  return Object.keys(obj)
}

export const pickKeys = <T extends string & keyof O, O extends {}>(
  obj: O,
  keysObj: KeysObj<T>
): Pick<O, T> => {
  const keys = unionToArray<T>(keysObj)
  const entries = Object.entries(obj)
    .filter(([key]) => keys.includes(key))
    .map(([key, value]) => ({ [key]: value }))
  return merge({}, ...entries)
}
