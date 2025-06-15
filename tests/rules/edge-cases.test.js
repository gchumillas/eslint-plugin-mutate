const { RuleTester } = require('eslint');
const rule = require('../../rules/require-mut-prefix');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

ruleTester.run('require-mut-prefix edge cases', rule, {
  valid: [
    // ✅ Métodos que NO mutan (deberían ser ignorados)
    {
      code: `
        function processArray(array) {
          return array.map(x => x * 2);
        }
      `,
      options: []
    },
    {
      code: `
        function processArray(array) {
          return array.filter(x => x > 0);
        }
      `,
      options: []
    },
    {
      code: `
        function processArray(array) {
          return array.reduce((acc, val) => acc + val, 0);
        }
      `,
      options: []
    },
    {
      code: `
        function processArray(array) {
          const result = array.slice();
          return result;
        }
      `,
      options: []
    },

    // ✅ Propiedades anidadas con mut prefix
    {
      code: `
        function updateNested(mutObj) {
          mutObj.nested.property = 'value';
        }
      `,
      options: []
    },

    // ✅ Destructuring con mut prefix
    {
      code: `
        function updateProps(mutUser) {
          mutUser.name = 'New Name';
        }
      `,
      options: []
    },

    // ✅ Parámetros con nombres que contienen 'mut' pero no como prefijo
    {
      code: `
        function processData(computer) {
          return computer.cpu;
        }
      `,
      options: []
    },

    // ✅ Funciones con contextos complejos
    {
      code: `
        function outerFunction(data) {
          const mutLocalData = { ...data };
          
          function innerFunction() {
            mutLocalData.processed = true;
          }
          
          innerFunction();
          return mutLocalData;
        }
      `,
      options: []
    },

    // ✅ Callbacks y funciones de orden superior
    {
      code: `
        function processItems(items, callback) {
          return items.map(callback);
        }
      `,
      options: []
    },

    // ✅ Asíncrono con mut prefix
    {
      code: `
        async function updateAsync(mutData) {
          mutData.timestamp = await getCurrentTime();
        }
      `,
      options: []
    },

    // ✅ Generadores con mut prefix
    {
      code: `
        function* processGenerator(mutState) {
          mutState.count++;
          yield mutState.count;
        }
      `,
      options: []
    }
  ],

  invalid: [
    // ❌ Parámetros con nombres similares a 'mut' pero incorrectos
    {
      code: `
        function updateData(mutdata) {
          mutdata.value = 42;
        }
      `,
      errors: [{
        message: "Parameter 'mutdata' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutMutdata'.",
        type: 'Identifier'
      }]
    },
    {
      code: `
        function updateData(Mutdata) {
          Mutdata.value = 42;
        }
      `,
      errors: [{
        message: "Parameter 'Mutdata' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutMutdata'.",
        type: 'Identifier'
      }]
    },
    {
      code: `
        function updateData(mut_data) {
          mut_data.value = 42;
        }
      `,
      errors: [{
        message: "Parameter 'mut_data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutMut_data'.",
        type: 'Identifier'
      }]
    },

    // ❌ Funciones async sin mut prefix
    {
      code: `
        async function updateAsync(data) {
          data.timestamp = await getCurrentTime();
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Generadores sin mut prefix
    {
      code: `
        function* processGenerator(state) {
          state.count++;
          yield state.count;
        }
      `,
      errors: [{
        message: "Parameter 'state' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutState'.",
        type: 'Identifier'
      }]
    },

    // ❌ Métodos de clase sin mut prefix
    {
      code: `
        class DataProcessor {
          process(data) {
            data.processed = true;
          }
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Funciones con try/catch
    {
      code: `
        function riskyUpdate(obj) {
          try {
            obj.value = riskyOperation();
          } catch (error) {
            obj.error = error.message;
          }
        }
      `,
      errors: [{
        message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
        type: 'Identifier'
      }]
    },

    // ❌ Funciones con condicionales
    {
      code: `
        function conditionalUpdate(data, condition) {
          if (condition) {
            data.updated = true;
          } else {
            data.skipped = true;
          }
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    },

    // ❌ Funciones con loops
    {
      code: `
        function processInLoop(obj, items) {
          for (const item of items) {
            obj[item.key] = item.value;
          }
        }
      `,
      errors: [{
        message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
        type: 'Identifier'
      }]
    },

    // ❌ Asignación usando computed properties
    {
      code: `
        function updateDynamic(obj, key, value) {
          obj[key] = value;
        }
      `,
      errors: [{
        message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
        type: 'Identifier'
      }]
    },

    // ❌ Múltiples niveles de anidación
    {
      code: `
        function deepUpdate(data) {
          if (true) {
            if (true) {
              data.nested.deep.value = 42;
            }
          }
        }
      `,
      errors: [{
        message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
        type: 'Identifier'
      }]
    }
  ]
});