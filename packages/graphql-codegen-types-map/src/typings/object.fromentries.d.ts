declare module 'object.fromentries' {
  const fromTypes: <Key extends PropertyKey, Value>(entries: Iterable<[Key, Value]>) => { [key: Key]: Value }
  export default fromTypes
}
