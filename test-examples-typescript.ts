// Examples for testing TypeScript support in eslint-plugin-mutate
// Run with: npx eslint test-examples-typescript.ts

// Import the Mut<T> type explicitly for this example file
import type { Mut } from './index';

// ✅ VALID - Parameters with Mut<T> type that are correctly mutated
function doSomething(items: Mut<number[]>) {
  // OK - items is marked as mutable
  items.push(4);
}

function processUser(user: Mut<{name: string; age: number}>) {
  // OK - user is marked as mutable  
  user.name = 'John';
  user.age++;
}

const updateArray = (data: Mut<string[]>) => {
  // OK - data is marked as mutable
  data.pop();
  data.shift();
  data.sort();
};

function modifyObject(obj: Mut<{count: number}>) {
  // OK - obj is marked as mutable
  obj.count = 42;
}

function deepMutation(user: Mut<{profile: {name: string}}>) {
  // OK - user is marked as mutable, allows deep property access
  user.profile.name = 'Jane';
}

// ✅ VALID - Parameters without Mut<T> type that are NOT mutated (read-only)
function readOnly(items: number[]) {
  // OK - only reading, no mutation
  console.log(items.length);
  console.log(items[0]);
}

function calculateSum(numbers: number[]) {
  // OK - only reading for calculation
  return numbers.reduce((sum, num) => sum + num, 0);
}

function logUser(user: {name: string}) {
  // OK - only reading
  console.log(user.name);
}

// ✅ VALID - Mixed parameters - only mutable ones need Mut<T>
function processData(readOnlyData: string[], mutResults: Mut<number[]>) {
  // OK - reading from readOnlyData, mutating mutResults
  console.log(readOnlyData.length);
  mutResults.push(42);
}

// ❌ INVALID - Parameters mutated without Mut<T> type
function badDoSomething(items: number[]) {
  // ERROR - items is mutated but doesn't have Mut<T> type
  items.push(4);
}

function badProcessUser(user: {name: string}) {
  // ERROR - user is mutated but doesn't have Mut<T> type
  user.name = 'John';
}

const badUpdateCounter = (counter: {value: number}) => {
  // ERROR - counter is mutated but doesn't have Mut<T> type
  counter.value++;
};

function badModifyArray(arr: string[]) {
  // ERROR - arr is mutated but doesn't have Mut<T> type
  arr.pop();
  arr.sort();
}

function badDeepMutation(obj: {nested: {prop: string}}) {
  // ERROR - obj is mutated but doesn't have Mut<T> type
  obj.nested.prop = 'new value';
}

// ❌ INVALID - Multiple parameters with mutations
function multiMutation(arr1: number[], arr2: string[]) {
  // ERROR - both arr1 and arr2 are mutated but don't have Mut<T> type
  arr1.push(1);
  arr2.pop();
}

// ❌ INVALID - Nested function mutations
function outer(data: any[]) {
  function inner() {
    // ERROR - data (from outer scope) is mutated but doesn't have Mut<T> type
    data.push(1);
  }
  inner();
}

// Examples of usage
const items = [1, 2, 3] as Mut<number[]>;
doSomething(items);
console.log(items); // [1, 2, 3, 4]

const user = {name: 'Alice', age: 30} as Mut<{name: string; age: number}>;
processUser(user);
console.log(user); // {name: 'John', age: 31}
