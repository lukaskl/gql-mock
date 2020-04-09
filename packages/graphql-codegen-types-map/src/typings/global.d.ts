/**
 * These types will NOT be included
 * to the final bundle
 * be careful adding things here
 */
interface ArrayConstructor {
  isArray<T>(arg: ReadonlyArray<T> | any): arg is ReadonlyArray<T>
}
