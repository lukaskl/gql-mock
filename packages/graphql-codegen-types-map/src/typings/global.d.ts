interface ArrayConstructor {
  isArray<T>(arg: ReadonlyArray<T> | any): arg is ReadonlyArray<T>
}

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn
