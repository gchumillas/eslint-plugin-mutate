# eslint-plugin-mutate

ESLint plugin to enforce mutation awareness in JavaScript by requiring the `mut` prefix for parameters that are mutated within functions. The goal is to make code more explicit about side effects and encourage immutable programming patterns.

<img width="591" alt="Image" src="https://github.com/user-attachments/assets/882a825a-5bfa-465f-8c70-d158685fb616" />

## Why use this plugin?

- **Code clarity**: Makes it explicit when a function may mutate its parameters
- **Error prevention**: Helps identify unintended mutations
- **Better maintainability**: Developers immediately understand the function's behavior
- **Functional programming**: Encourages the use of immutable patterns

## Installation

```bash
npm install --save-dev eslint-plugin-mutate
```

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
    'mutate/require-mut-param-prefix': 'error',  // Check parameters within functions
    'mutate/require-mut-var-prefix': 'error'     // Check variables passed to functions
  }
};
```

## Rules

### `mutate/require-mut-param-prefix`

Requires parameters that are mutated within a function to have the `mut` prefix and start with uppercase after the prefix.

**What it detects:**
- Property assignments on parameters (`param.property = value`)
- Increment/decrement operations (`param.counter++`)
- Mutating array/object methods (`param.push()`, `param.sort()`, etc.)
- Deep property mutations (`param.nested.deep.property = value`)

### `mutate/require-mut-var-prefix` 

Requires variables passed to functions that mutate their parameters to have the `mut` prefix.

**What it detects:**
- Variables passed as arguments to functions that have `mut`-prefixed parameters
- Cross-function analysis to track mutation chains
- Both regular functions and arrow functions
- Variables that will be mutated indirectly through function calls

## Rule Types Explained

### Parameter Rule (`require-mut-param-prefix`)

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

### Variable Rule (`require-mut-var-prefix`)

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
    'mutate/require-mut-param-prefix': 'error',
    'mutate/require-mut-var-prefix': 'off',
    
    // Only check variable usage (for library consumers)
    'mutate/require-mut-param-prefix': 'off',
    'mutate/require-mut-var-prefix': 'error',
    
    // Check both (recommended for most projects)
    'mutate/require-mut-param-prefix': 'error',
    'mutate/require-mut-var-prefix': 'error'
  }
};
```

#### ❌ Incorrect examples

**Parameter Rule Violations (`require-mut-param-prefix`):**

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

**Variable Rule Violations (`require-mut-var-prefix`):**

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

#### ✅ Correct examples

**Parameter Rule Compliance:**

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

**Variable Rule Compliance:**

```javascript
// Functions that mutate parameters
function updateUser(mutUser) {
  mutUser.name = 'Updated';
}

function addToList(mutList, item) {
  mutList.push(item);
}

// ✓ Variables with correct mut prefix
const mutUserData = { name: 'John' }; // ✓ Correct
updateUser(mutUserData); // ✓ Correct

const mutItems = []; // ✓ Correct
addToList(mutItems, 'new item'); // ✓ Correct

// Functions that don't mutate parameters don't require mut prefix
function readData(data) {
  return data.length;
}

const normalData = [1, 2, 3]; // ✓ Correct (readData doesn't mutate)
readData(normalData); // ✓ Correct
```
```

## Cross-Function Analysis

The plugin also performs cross-function analysis to detect when variables are passed to functions that mutate their parameters. This works with both regular functions and arrow functions.

#### ❌ Incorrect examples

```javascript
// Regular functions
function updateUser(mutUser) {
  mutUser.lastLogin = new Date();
}

function processData() {
  const userData = { name: 'John' }; // Error: should be 'mutUserData'
  updateUser(userData); // Error: userData should have 'mut' prefix
}

// Arrow functions
const updateUser = (mutUser) => {
  mutUser.lastLogin = new Date();
};

const processData = () => {
  const userData = { name: 'John' }; // Error: should be 'mutUserData'
  updateUser(userData); // Error: userData should have 'mut' prefix
};

const addToList = (mutList, item) => {
  mutList.push(item);
};

const main = () => {
  const items = []; // Error: should be 'mutItems'
  addToList(items, 'new item'); // Error: items should have 'mut' prefix
};
```

#### ✅ Correct examples

```javascript
// Regular functions
function updateUser(mutUser) {
  mutUser.lastLogin = new Date();
}

function processData() {
  const mutUserData = { name: 'John' }; // ✓ Correct
  updateUser(mutUserData); // ✓ Correct
}

// Arrow functions
const updateUser = (mutUser) => {
  mutUser.lastLogin = new Date();
};

const processData = () => {
  const mutUserData = { name: 'John' }; // ✓ Correct
  updateUser(mutUserData); // ✓ Correct
};

const addToList = (mutList, item) => {
  mutList.push(item);
};

const main = () => {
  const mutItems = []; // ✓ Correct
  addToList(mutItems, 'new item'); // ✓ Correct
};

// Functions that don't mutate parameters don't trigger warnings
const readData = (data) => {
  return data.length;
};

const test = () => {
  const items = [1, 2, 3]; // ✓ Correct (readData doesn't mutate)
  readData(items); // ✓ Correct
};
```
```

## Detected mutations

The plugin detects the following operations as mutations:

### Property assignments
```javascript
obj.property = value;
obj['property'] = value;
```

### Increment/decrement operators
```javascript
obj.counter++;
++obj.counter;
obj.counter--;
--obj.counter;
```

### Array methods that mutate
```javascript
array.push();
array.pop();
array.shift();
array.unshift();
array.splice();
array.sort();
array.reverse();
array.fill();
```

## Usage in VSCode

1. Install the ESLint extension in VSCode
2. Configure your project with this plugin
3. VSCode will automatically show mutation errors
4. Errors will appear underlined in red with the corresponding explanation

## Naming convention

- The prefix must be exactly `mut`
- The first letter after `mut` must be uppercase
- Valid examples: `mutUser`, `mutList`, `mutCounter`, `mutData`
- Invalid examples: `mutuser`, `mut_user`, `Mutuser`

## Integration with other plugins

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
