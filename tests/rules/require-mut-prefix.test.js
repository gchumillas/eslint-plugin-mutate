const { RuleTester } = require('eslint');
const rule = require('../../rules/require-mut-prefix');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

ruleTester.run('require-mut-prefix', rule, {
  valid: [
    // ✅ Parámetros con prefijo mut que son mutados correctamente
    {
      code: `
        function doSomething(mutUser) {
          mutUser.registered = true;
        }
      `,
      options: []
    },
    {
      code: `
        function addItem(mutList, item) {
          mutList.push(item);
        }
      `,
      options: []
    },
    {
      code: `
        function updateCounter(mutCounter) {
          mutCounter.value++;
        }
      `,
      options: []
    },
    {
      code: `
        const processData = (mutData) => {
          mutData.processed = true;
        };
      `,
      options: []
    },
    {
      code: `
        function modifyArray(mutArray) {
          mutArray.pop();
          mutArray.shift();
          mutArray.unshift(1);
          mutArray.splice(0, 1);
          mutArray.sort();
          mutArray.reverse();
          mutArray.fill(0);
        }
      `,
      options: []
    },

    // ✅ Parámetros sin mutación (no necesitan prefijo mut)
    {
      code: `
        function readUser(user) {
          return user.name;
        }
      `,
      options: []
    },
    {
      code: `
        function calculateTotal(items) {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
      `,
      options: []
    },
    {
      code: `
        function getUserInfo(user) {
          console.log(user.name);
          return user.email;
        }
      `,
      options: []
    },

    // ✅ Crear nuevos objetos (no muta el original)
    {
      code: `
        function updateUser(user, newData) {
          return { ...user, ...newData };
        }
      `,
      options: []
    },
    {
      code: `
        function addToArray(array, item) {
          return [...array, item];
        }
      `,
      options: []
    },

    // ✅ Mutación de variables locales (no parámetros)
    {
      code: `
        function processItems(items) {
          const localArray = [];
          localArray.push(...items);
          localArray.sort();
          return localArray;
        }
      `,
      options: []
    },

    // ✅ Funciones sin parámetros
    {
      code: `
        function doSomething() {
          const obj = {};
          obj.value = 42;
        }
      `,
      options: []
    },

    // ✅ Métodos de objetos
    {
      code: `
        const handler = {
          process(mutData) {
            mutData.processed = true;
          }
        };
      `,
      options: []
    }
  ],

  invalid: [
    // ❌ Asignación a propiedades sin prefijo mut
    {
      code: `
        function doSomething(user) {
          user.registered = true;
        }
      `,
      errors: [{
        message: "Parameter 'user' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutUser'.",
        type: 'Identifier'
      }]
    },

    // ❌ Múltiples mutaciones del mismo parámetro
    {
      code: `
        function updateUser(user, data) {
          user.name = data.name;
          user.email = data.email;
          user.updated = true;
        }
      `,
      errors: [{
        message: "Parameter 'user' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutUser'.",
        type: 'Identifier'
      }]
    },

    // ❌ Operadores de incremento/decremento
    {
      code: `
        function incrementCounter(counter) {
          counter.value++;
        }
      `,
      errors: [{
        message: "Parameter 'counter' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutCounter'.",
        type: 'Identifier'
      }]
    },
    {
      code: `
        function decrementCounter(counter) {
          --counter.value;
        }
      `,
      errors: [{
        message: "Parameter 'counter' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutCounter'.",
        type: 'Identifier'
      }]
    },

    // ❌ Métodos de array que mutan - push
    {
      code: `
        function addItem(list, item) {
          list.push(item);
        }
      `,
      errors: [{
        message: "Parameter 'list' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutList'.",
        type: 'Identifier'
      }]
    },

    // ❌ Métodos de array que mutan - pop
    {
      code: `
        function removeLastItem(array) {
          return array.pop();
        }
      `,
      errors: [{
        message: "Parameter 'array' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutArray'.",
        type: 'Identifier'
      }]
    },

    // ❌ Métodos de array que mutan - splice
    {
      code: `
        function removeItems(items, start, count) {
          items.splice(start, count);
        }
      `,
      errors: [{
        message: "Parameter 'items' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutItems'.",
        type: 'Identifier'
      }]
    },

    // ❌ Métodos de array que mutan - sort
    {
      code: `
        function sortArray(data) {
          data.sort((a, b) => a - b);
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Función flecha
    {
      code: `
        const updateObject = (obj) => {
          obj.updated = true;
        };
      `,
      errors: [{
        message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
        type: 'Identifier'
      }]
    },

    // ❌ Múltiples parámetros, uno mutado
    {
      code: `
        function processData(config, data, options) {
          data.processed = true;
          return config.value + options.multiplier;
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Múltiples parámetros mutados
    {
      code: `
        function updateBoth(user, settings) {
          user.lastLogin = new Date();
          settings.theme = 'dark';
        }
      `,
      errors: [
        {
          message: "Parameter 'user' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutUser'.",
          type: 'Identifier'
        },
        {
          message: "Parameter 'settings' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutSettings'.",
          type: 'Identifier'
        }
      ]
    },

    // ❌ Función anidada con mutación
    {
      code: `
        function outerFunction(data) {
          function innerFunction() {
            data.modified = true;
          }
          innerFunction();
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Diferentes tipos de mutación en la misma función
    {
      code: `
        function complexMutation(obj, arr) {
          obj.value = 42;
          arr.push('item');
          obj.counter++;
          arr.sort();
        }
      `,
      errors: [
        {
          message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
          type: 'Identifier'
        },
        {
          message: "Parameter 'arr' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutArr'.",
          type: 'Identifier'
        }
      ]
    }
  ]
});