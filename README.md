# eslint-plugin-mutate

ESLint plugin to enforce mutation awareness in JavaScript and TypeScript by requiring the `mut` prefix for parameters that are mutated within functions (JavaScript) or the `Mut<T>` type annotation (TypeScript). The goal is to make code more explicit about side effects and encourage immutable programming patterns.

## Why use this plugin?

If you're an experienced developer, you probably know that modifying function parameters is not recommended, as they are modified "in origin" and can cause hard-to-detect side effects (bugs).

The following is a real-world example. The `doSomething` function inadvertently modifies the `items` parameter, causing unintended side effects:

```ts
function doSomething(items: []number) {
   // we just wanted to get the first item
   // but we forgot that `shift()` mutates `items`
   const firstItem = items.shift()
   console.log(firstItem) // prints 1
}

const items = [1, 2, 3];
doSomething(items)
console.log(items) // prints [2, 3] !!!
```

This plugin solves this problem by enforcing explicit mutation markers that make side effects visible:

```ts
// ⚠️ `items` is mutated in origin (use `numItems` in JavaScript)
function doSomething(items: Mut<[]number>) {
   const firstItem = items.shift()
   console.log(firstItem) // prints 1
}

// ⚠️ `items` can be mutated (use `numItems` in JavaScript)
const items: Mut<[]number> = [1, 2, 3];
doSomething(items)
console.log(items) // prints [2, 3] !!!
```

Now it's impossible to accidentally mutate `items` - the name itself warns you!

**In summary:**
- **Code clarity**: Makes it explicit when a function may mutate its parameters
- **Error prevention**: Helps identify unintended mutations
- **Better maintainability**: Developers immediately understand the function's behavior
- **Functional programming**: Encourages the use of immutable patterns

## Requirements

- **Node.js**: 16.0.0 or higher
- **ESLint**: 7.0.0 or higher
- **TypeScript** (optional): 3.0.0 or higher for TypeScript projects

> **Note**: Node.js 14 and earlier are not supported due to dependencies that require modern JavaScript features. We recommend using the latest LTS version of Node.js for the best experience.

## Language Support

This plugin supports both **JavaScript** and **TypeScript** with different approaches:

### JavaScript - `mut` Prefix Convention

In JavaScript files (`.js`, `.jsx`), the plugin enforces the `mut` prefix naming convention:

```js
// ❌ Parameter is mutated but lacks 'mut' prefix
function doSomething(items) {
   const firstItem = items.shift() // Error: 'items' should be 'mutItems'
}

// ✅ Parameter has 'mut' prefix indicating it will be mutated
function doSomething(mutItems) {
   const firstItem = mutItems.shift() // Correct
}
```

### TypeScript - `Mut<T>` Type Annotation

In TypeScript files (`.ts`, `.tsx`), the plugin enforces the `Mut<T>` type annotation:

```ts
// ❌ Parameter is mutated but lacks 'Mut<T>' type
function doSomething(items: number[]) {
   const firstItem = items.shift() // Error: should be 'Mut<number[]>'
}

// ✅ Parameter has 'Mut<T>' type indicating it will be mutated
function doSomething(items: Mut<number[]>) {
   const firstItem = items.shift() // Correct
}
```

The `Mut<T>` type is available in **two ways** for maximum flexibility:

#### Option 1: Global Declaration (Recommended)
Add `"types": ["eslint-plugin-mutate"]` to your `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "types": ["eslint-plugin-mutate"]
  }
}
```

Then use `Mut<T>` anywhere without imports:

```ts
// No import needed!
function processUser(user: Mut<{name: string; age: number}>) {
  user.name = 'John';  // OK - user is marked as mutable
  user.age++;          // OK - user is marked as mutable
}

function processArray(items: Mut<string[]>) {
  items.push('new');   // OK - items is marked as mutable
  items.sort();        // OK - items is marked as mutable
}
```

#### Option 2: Explicit Import
If you prefer explicit imports or can't modify `tsconfig.json`:

```ts
import type { Mut } from 'eslint-plugin-mutate';

function processUser(user: Mut<{name: string}>) {
  user.name = 'Updated'; // OK - user is marked as mutable
}

function updateArray(items: Mut<number[]>) {
  items.push(42); // OK - items is marked as mutable
}
```

Both approaches work identically - choose what fits your project best!

## Installation and usage in VSCode

```bash
npm install --save-dev eslint-plugin-mutate

# For TypeScript support, also install:
npm install --save-dev @typescript-eslint/parser
```

1. Install the ESLint extension in VSCode
2. Configure your project with this plugin  
3. VSCode will automatically show mutation errors
4. Errors will appear underlined in red with the corresponding explanation
5. **TypeScript users**: The `Mut<T>` type is automatically available globally - no import needed!

## Configuration

### Recommended configuration

```javascript
module.exports = {
  extends: ['plugin:mutate/recommended']
};
```

This enables both the parameter prefix rule and variable prefix rule with default settings.

### Manual configuration (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-param': 'error',  // Check parameters within functions
    'mutate/require-mut-var': 'error'     // Check variables passed to functions
  }
};
```

## Rules

### `mutate/require-mut-param`

Requires parameters that are mutated within a function to have the appropriate mutation marker:
- **JavaScript files**: `mut` prefix with uppercase letter after prefix (e.g., `mutUser`, `mutList`)
- **TypeScript files**: `Mut<T>` type annotation (e.g., `user: Mut<UserType>`)

**What it detects:**
- Property assignments on parameters (`param.property = value`)
- Increment/decrement operations (`param.counter++`)
- Mutating array/object methods (`param.push()`, `param.sort()`, etc.)
- Deep property mutations (`param.nested.deep.property = value`)

**JavaScript examples:**
```js
// ❌ Missing mut prefix
function updateUser(user) {
  user.name = 'Updated'; // Error: Parameter 'user' should be 'mutUser'
}

// ✅ Correct mut prefix
function updateUser(mutUser) {
  mutUser.name = 'Updated'; // Correct
}
```

**TypeScript examples:**
```ts
// ❌ Missing Mut<T> type
function updateUser(user: {name: string}) {
  user.name = 'Updated'; // Error: Parameter should have 'Mut<T>' type
}

// ✅ Correct Mut<T> type
function updateUser(user: Mut<{name: string}>) {
  user.name = 'Updated'; // Correct
}
```

### `mutate/require-mut-var` 

Requires variables passed to functions that mutate their parameters to have the `mut` prefix.

**What it detects:**
- Variables passed as arguments to functions that have `mut`-prefixed parameters
- Cross-function analysis to track mutation chains
- Both regular functions and arrow functions
- Variables that will be mutated indirectly through function calls

## Rule Types Explained

### Parameter Rule (`require-mut-param`)

This rule focuses on **function definitions** and checks if parameters that get mutated inside the function have the proper `mut` prefix.

```javascript
// ❌ Parameter 'user' is mutated but lacks 'mut' prefix
function updateUser(user) {
  user.name = 'Updated'; // Mutation detected here
}

// ✅ Parameter has correct 'mut' prefix
function updateUser(mutUser) {
  mutUser.name = 'Updated'; // Correct
}
```

### Variable Rule (`require-mut-var`)

This rule focuses on **function calls** and checks if variables passed to functions that mutate their parameters have the proper `mut` prefix.

```javascript
// First, define a function that mutates its parameter
function updateUser(mutUser) {
  mutUser.name = 'Updated';
}

// ❌ Variable 'user' will be mutated but lacks 'mut' prefix
const user = { name: 'John' };
updateUser(user); // Error: 'user' should be 'mutUser'

// ✅ Variable has correct 'mut' prefix
const mutUser = { name: 'John' };
updateUser(mutUser); // Correct
```

### Granular Control

You can enable rules individually based on your project needs:

```javascript
module.exports = {
  plugins: ['mutate'],
  rules: {
    // Only check function parameters (for library authors)
    'mutate/require-mut-param': 'error',
    'mutate/require-mut-var': 'off',
    
    // Only check variable usage (for library consumers)
    'mutate/require-mut-param': 'off',
    'mutate/require-mut-var': 'error',
    
    // Check both (recommended for most projects)
    'mutate/require-mut-param': 'error',
    'mutate/require-mut-var': 'error'
  }
};
```

#### ❌ Incorrect examples

**Parameter Rule Violations (`require-mut-param`):**

*JavaScript files:*
```javascript
// ❌ Parameter without mut prefix
function doSomething(user) {
  user.registered = true; // Error: Parameter 'user' is mutated but doesn't have 'mut' prefix
}

function addItem(list, item) {
  list.push(item); // Error: Parameter 'list' is mutated but doesn't have 'mut' prefix
}

function updateCounter(counter) {
  counter.value++; // Error: Parameter 'counter' is mutated but doesn't have 'mut' prefix
}
```

*TypeScript files:*
```typescript
// ❌ Parameter without Mut<T> type
function doSomething(user: {registered: boolean}) {
  user.registered = true; // Error: Parameter should have 'Mut<T>' type annotation
}

function addItem(list: number[], item: number) {
  list.push(item); // Error: Parameter should be 'Mut<number[]>'
}

function updateCounter(counter: {value: number}) {
  counter.value++; // Error: Parameter should have 'Mut<T>' type annotation
}
```

**Variable Rule Violations (`require-mut-var`):**

*JavaScript files:*
```javascript
// First define functions that mutate parameters
function updateUser(mutUser) {
  mutUser.name = 'Updated';
}

function addToList(mutList, item) {
  mutList.push(item);
}

// ❌ Variables without mut prefix passed to mutating functions
const userData = { name: 'John' }; // Error: should be 'mutUserData'
updateUser(userData); // Error: userData should have 'mut' prefix

const items = []; // Error: should be 'mutItems'
addToList(items, 'new item'); // Error: items should have 'mut' prefix
```

*TypeScript files:*
```typescript
// First define functions that mutate parameters
function updateUser(user: Mut<{name: string}>) {
  user.name = 'Updated';
}

function addToList(list: Mut<string[]>, item: string) {
  list.push(item);
}

// ❌ Variables without mut prefix (TypeScript still uses mut prefix for variables)
const userData = { name: 'John' }; // Error: should be 'mutUserData'
updateUser(userData); // Error: userData should have 'mut' prefix

const items: string[] = []; // Error: should be 'mutItems'
addToList(items, 'new item'); // Error: items should have 'mut' prefix
```

#### ✅ Correct examples

**Parameter Rule Compliance:**

*JavaScript files:*
```javascript
function doSomething(mutUser) {
  mutUser.registered = true; // ✓ Correct
}

function addItem(mutList, item) {
  mutList.push(item); // ✓ Correct
}

function updateCounter(mutCounter) {
  mutCounter.value++; // ✓ Correct
}

// Parameters that are not mutated don't need the prefix
function readUserData(user) {
  return user.name; // ✓ Correct
}

// Creating new objects is correct (doesn't mutate the original)
function updateUser(user, newData) {
  return { ...user, ...newData }; // ✓ Correct
}
```

*TypeScript files:*
```typescript
function doSomething(user: Mut<{registered: boolean}>) {
  user.registered = true; // ✓ Correct
}

function addItem(list: Mut<number[]>, item: number) {
  list.push(item); // ✓ Correct
}

function updateCounter(counter: Mut<{value: number}>) {
  counter.value++; // ✓ Correct
}

// Parameters that are not mutated don't need Mut<T>
function readUserData(user: {name: string}) {
  return user.name; // ✓ Correct
}

// Creating new objects is correct (doesn't mutate the original)
function updateUser(user: {name: string}, newData: Partial<typeof user>) {
  return { ...user, ...newData }; // ✓ Correct
}
```

**Variable Rule Compliance:**

*JavaScript and TypeScript files (variables always use mut prefix):*
```javascript
// Functions that mutate parameters
function updateUser(mutUser) {  // JavaScript
  mutUser.name = 'Updated';
}

function addToList(list: Mut<string[]>, item: string) {  // TypeScript
  list.push(item);
}

// ✓ Variables with correct mut prefix
const mutUserData = { name: 'John' }; // ✓ Correct
updateUser(mutUserData); // ✓ Correct

const mutItems: string[] = []; // ✓ Correct (TypeScript)
addToList(mutItems, 'new item'); // ✓ Correct

// Functions that don't mutate parameters don't require mut prefix
function readData(data) {
  return data.length;
}

const normalData = [1, 2, 3]; // ✓ Correct (readData doesn't mutate)
readData(normalData); // ✓ Correct
```

## Naming convention

### JavaScript files
- The prefix must be exactly `mut`
- The first letter after `mut` must be uppercase
- Valid examples: `mutUser`, `mutList`, `mutCounter`, `mutData`
- Invalid examples: `mutuser`, `mut_user`, `Mutuser`

### TypeScript files
- **Parameters**: Use `Mut<T>` type annotation where `T` is the original type
- **Variables**: Still use the `mut` prefix convention (same as JavaScript)
- Valid parameter examples: `user: Mut<UserType>`, `items: Mut<string[]>`, `data: Mut<{count: number}>`
- Valid variable examples: `mutUser`, `mutItems`, `mutData`

The `Mut<T>` type:
- Only works with object types (arrays, objects, etc.)
- Scalar types (string, number, boolean) cannot be mutated in JavaScript
- Is a simple utility type: `type Mut<T extends object> = T`

## Integration with other plugins

This plugin works well together with:
- `eslint-plugin-functional` - For stricter functional programming
- `eslint-plugin-immutable` - For more complete immutability
- `eslint-plugin-pure` - For pure functions

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a branch for your feature
3. Add tests for new functionality
4. Make sure all tests pass
5. Submit a pull request

## License

MIT
