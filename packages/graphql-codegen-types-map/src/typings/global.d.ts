interface ArrayConstructor {
  isArray<T>(arg: ReadonlyArray<T> | any): arg is ReadonlyArray<T>
}
