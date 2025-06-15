# eslint-plugin-mutate

Plugin de ESLint para fomentar la conciencia sobre mutaciones de parámetros en JavaScript, requiriendo el uso del prefijo `mut` para parámetros que son mutados dentro de funciones.

## ¿Por qué usar este plugin?

- **Claridad en el código**: Hace explícito cuándo una función puede mutar sus parámetros
- **Prevención de errores**: Ayuda a identificar mutaciones no intencionadas
- **Mejor mantenibilidad**: Los desarrolladores entienden inmediatamente el comportamiento de la función
- **Programación funcional**: Fomenta el uso de patrones inmutables

## Instalación

```bash
npm install --save-dev eslint-plugin-mutate
```

## Configuración

### Configuración básica (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-prefix': 'error'
  }
};
```

### Configuración recomendada

```javascript
module.exports = {
  extends: ['plugin:mutate/recommended']
};
```

## Reglas

### `mutate/require-mut-prefix`

Requiere que los parámetros que son mutados dentro de una función tengan el prefijo `mut` y empiecen con mayúscula después del prefijo.

#### ❌ Ejemplos incorrectos

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

#### ✅ Ejemplos correctos

```javascript
function doSomething(mutUser) {
  mutUser.registered = true; // ✓ Correcto
}

function addItem(mutList, item) {
  mutList.push(item); // ✓ Correcto
}

function updateCounter(mutCounter) {
  mutCounter.value++; // ✓ Correcto
}

// Los parámetros que no se mutan no necesitan el prefijo
function readUserData(user) {
  return user.name; // ✓ Correcto
}

// Crear nuevos objetos es correcto (no muta el original)
function updateUser(user, newData) {
  return { ...user, ...newData }; // ✓ Correcto
}
```

## Mutaciones detectadas

El plugin detecta las siguientes operaciones como mutaciones:

### Asignaciones a propiedades
```javascript
obj.property = value;
obj['property'] = value;
```

### Operadores de incremento/decremento
```javascript
obj.counter++;
++obj.counter;
obj.counter--;
--obj.counter;
```

### Métodos de array que mutan
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

## Uso en VSCode

1. Instala la extensión de ESLint en VSCode
2. Configura tu proyecto con este plugin
3. VSCode mostrará automáticamente los errores de mutación
4. Los errores aparecerán subrayados en rojo con la explicación correspondiente

## Convención de nombres

- El prefijo debe ser exactamente `mut`
- La primera letra después de `mut` debe ser mayúscula
- Ejemplos válidos: `mutUser`, `mutList`, `mutCounter`, `mutData`
- Ejemplos inválidos: `mutuser`, `mut_user`, `Mutuser`

## Integración con otros plugins

Este plugin funciona bien junto con:
- `eslint-plugin-functional` - Para programación funcional más estricta
- `eslint-plugin-immutable` - Para inmutabilidad más completa
- `eslint-plugin-pure` - Para funciones puras

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Añade tests para nuevas funcionalidades
4. Asegúrate de que todos los tests pasen
5. Envía un pull request

## Licencia

MIT