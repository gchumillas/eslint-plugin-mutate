# eslint-plugin-mutate

ESLint plugin to enforce mutation awareness in JavaScript by requiring the `mut` prefix for parameters that are mutated within functions. The goal is to make code more explicit about side effects and encourage immutable programming patterns.

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

### Basic configuration (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-prefix': 'error'
  }
};
```

### Recommended configuration

```javascript
module.exports = {
  extends: ['plugin:mutate/recommended']
};
```

## Rules

### `mutate/require-mut-prefix`

Requires parameters that are mutated within a function to have the `mut` prefix and start with uppercase after the prefix.

#### ❌ Incorrect examples

```javascript
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

#### ✅ Correct examples

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