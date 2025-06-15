// ❌ BAD - Parameter is mutated but doesn't have 'mut' prefix
function doSomething(user) {
  user.registered = true; // ESLint will report error here
}

function addItem(list, item) {
  list.push(item); // ESLint will report error here
}

function updateCounter(counter) {
  counter.value++; // ESLint will report error here
}

// ✅ GOOD - Mutated parameters have 'mut' prefix
function doSomethingCorrect(mutUser) {
  mutUser.registered = true; // ✓ Correct
}

function addItemCorrect(mutList, item) {
  mutList.push(item); // ✓ Correct
}

function updateCounterCorrect(mutCounter) {
  mutCounter.value++; // ✓ Correct
}

// ✅ GOOD - Parameters are not mutated, no prefix needed
function readUserData(user) {
  return user.name; // ✓ Correct, read-only
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0); // ✓ Correct, read-only
}

// ✅ GOOD - Creating new objects is correct
function updateUser(user, newData) {
  return { ...user, ...newData }; // ✓ Correct, doesn't mutate the original
}

// Examples of methods that the plugin detects as mutation:
function testMutatingMethods(mutArray, mutObj) {
  // Array methods that mutate:
  mutArray.push(1);      // ✓ Correct with mut prefix
  mutArray.pop();        // ✓ Correct with mut prefix
  mutArray.shift();      // ✓ Correct with mut prefix
  mutArray.unshift(0);   // ✓ Correct with mut prefix
  mutArray.splice(1, 1); // ✓ Correct with mut prefix
  mutArray.sort();       // ✓ Correct with mut prefix
  mutArray.reverse();    // ✓ Correct with mut prefix
  mutArray.fill(0);      // ✓ Correct with mut prefix
  
  // Property assignments:
  mutObj.property = 'value'; // ✓ Correct with mut prefix
  
  // Increment/decrement operators:
  mutObj.counter++; // ✓ Correct with mut prefix
  ++mutObj.counter; // ✓ Correct with mut prefix
}