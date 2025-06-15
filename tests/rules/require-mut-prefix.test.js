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
    // ✅ Parameters with mut prefix that are correctly mutated
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

    // ✅ Parameters without mutation (don't need mut prefix)
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

    // ✅ Creating new objects (doesn't mutate the original)
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

    // ✅ Mutation of local variables (not parameters)
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

    // ✅ Functions without parameters
    {
      code: `
        function doSomething() {
          const obj = {};
          obj.value = 42;
        }
      `,
      options: []
    },

    // ✅ Object methods
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
    // ❌ Property assignment without mut prefix
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

    // ❌ Multiple mutations of the same parameter
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

    // ❌ Increment/decrement operators
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

    // ❌ Array methods that mutate - push
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

    // ❌ Array methods that mutate - splice
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

    // ❌ Array methods that mutate - sort
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

    // ❌ Arrow function
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

    // ❌ Multiple parameters, one mutated
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

    // ❌ Multiple mutated parameters
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

    // ❌ Nested function with mutation
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

    // ❌ Different types of mutation in the same function
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