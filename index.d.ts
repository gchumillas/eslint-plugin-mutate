/**
 * Utility type to mark objects as mutable.
 * This type is used by eslint-plugin-mutate to indicate that a parameter
 * or variable is intended to be mutated.
 * 
 * Only works with object types (arrays, objects, etc.).
 * Scalar types (string, number, boolean) cannot be mutated in JavaScript.
 * 
 * @example
 * ```typescript
 * function processItems(items: Mut<number[]>) {
 *   items.push(4); // OK - items is marked as mutable
 * }
 * 
 * function processUser(user: Mut<{name: string}>) {
 *   user.name = 'John'; // OK - user is marked as mutable  
 * }
 * ```
 */
export type Mut<T extends object> = T;