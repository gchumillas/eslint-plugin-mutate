// ❌ MAL - El parámetro se muta pero no tiene prefijo 'mut'
function doSomething(user) {
  user.registered = true; // ESLint reportará error aquí
}

function addItem(list, item) {
  list.push(item); // ESLint reportará error aquí
}

function updateCounter(counter) {
  counter.value++; // ESLint reportará error aquí
}

// ✅ BIEN - Los parámetros mutados tienen prefijo 'mut'
function doSomethingCorrect(mutUser) {
  mutUser.registered = true; // ✓ Correcto
}

function addItemCorrect(mutList, item) {
  mutList.push(item); // ✓ Correcto
}

function updateCounterCorrect(mutCounter) {
  mutCounter.value++; // ✓ Correcto
}

// ✅ BIEN - Los parámetros no se mutan, no necesitan prefijo
function readUserData(user) {
  return user.name; // ✓ Correcto, solo lectura
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0); // ✓ Correcto, solo lectura
}

// ✅ BIEN - Crear nuevos objetos es correcto
function updateUser(user, newData) {
  return { ...user, ...newData }; // ✓ Correcto, no muta el original
}

// Ejemplos de métodos que el plugin detecta como mutación:
function testMutatingMethods(mutArray, mutObj) {
  // Métodos de array que mutan:
  mutArray.push(1);      // ✓ Correcto con prefijo mut
  mutArray.pop();        // ✓ Correcto con prefijo mut
  mutArray.shift();      // ✓ Correcto con prefijo mut
  mutArray.unshift(0);   // ✓ Correcto con prefijo mut
  mutArray.splice(1, 1); // ✓ Correcto con prefijo mut
  mutArray.sort();       // ✓ Correcto con prefijo mut
  mutArray.reverse();    // ✓ Correcto con prefijo mut
  mutArray.fill(0);      // ✓ Correcto con prefijo mut
  
  // Asignaciones a propiedades:
  mutObj.property = 'value'; // ✓ Correcto con prefijo mut
  
  // Operadores de incremento/decremento:
  mutObj.counter++; // ✓ Correcto con prefijo mut
  ++mutObj.counter; // ✓ Correcto con prefijo mut
}