import fromEntriesAny from 'object.fromentries'

export const fromEntries: <Key extends PropertyKey, Value>(
  entries: Iterable<[Key, Value]>
) => { [key in Key]: Value } = fromEntriesAny as any
