export type PickIfExists<
  Type extends {},
  Key extends string | number | symbol,
  Default = {}
> = Key extends keyof Type ? Type[Key] : Default

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>
}

export type RequireIfNotEmpty<PropName extends PropertyKey, T> = {} extends T
  ? { [key in PropName]?: T }
  : { [key in PropName]: T }

export type OptionalArray<T> = T | T[]

// We are spreading options and then taking the first one
// because we want to allow users of the API
// don't pass second argument if it isn't necessary
// see https://github.com/microsoft/TypeScript/issues/12400#issuecomment-428599865
export type OptionalSpread<T> = {} extends T ? [] | [T] : [T]
