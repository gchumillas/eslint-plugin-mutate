/**
 * Utility type to mark objects as mutable.
 * This type is used by eslint-plugin-mutate to indicate that a parameter
 * or variable is intended to be mutated.
 * 
 * Only works with object types (arrays, objects, etc.).
 * Scalar types (string, number, boolean) cannot be mutated in JavaScript.
 * 
 * Available in two ways:
 * 1. Globally (add "types": ["eslint-plugin-mutate"] to tsconfig.json)
 * 2. Via import: import { Mut } from 'eslint-plugin-mutate'
 * 
 * @example
 * ```typescript
 * // Option 1: Global usage (no import needed)
 * function processItems(items: Mut<number[]>) {
 *   items.push(4); // OK - items is marked as mutable
 * }
 * 
 * // Option 2: Explicit import
 * import { Mut } from 'eslint-plugin-mutate';
 * function processUser(user: Mut<{name: string}>) {
 *   user.name = 'John'; // OK - user is marked as mutable  
 * }
 * ```
 */

// Export for manual import
export type Mut<T extends object> = T;

// Global declaration for automatic availability
declare global {
  type Mut<T extends object> = T;
}

// This makes the file a module (required for both exports and global declarations)
export {};