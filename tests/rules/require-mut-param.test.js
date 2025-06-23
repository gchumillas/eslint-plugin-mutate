const { RuleTester } = require('eslint');
const rule = require('../../rules/require-mut-param');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

ruleTester.run('require-mut-param', rule, {
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
    // ✅ Parameters that are not mutated don't need the prefix
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
    // ✅ Creating new objects is correct (doesn't mutate the original)
    {
      code: `
        function updateUser(user, newData) {
          return { ...user, ...newData };
        }
      `,
      options: []
    },
    // ✅ Nested functions with correct prefix
    {
      code: `
        function updateNested(mutObj) {
          mutObj.nested.property = 'value';
        }
      `,
      options: []
    }
  ],

  invalid: [
    // ❌ Parameters that are mutated but don't have mut prefix
    {
      code: `
        function doSomething(user) {
          user.registered = true;
        }
      `,
      errors: [
        {
          message: "Parameter 'user' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutUser'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        function updateUser(user, data) {
          user.name = data.name;
          user.email = data.email;
          user.updated = true;
        }
      `,
      errors: [
        {
          message: "Parameter 'user' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutUser'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        function incrementCounter(counter) {
          counter.value++;
        }
      `,
      errors: [
        {
          message: "Parameter 'counter' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutCounter'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        function addItem(list, item) {
          list.push(item);
        }
      `,
      errors: [
        {
          message: "Parameter 'list' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutList'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        const updateObject = (obj) => {
          obj.updated = true;
        };
      `,
      errors: [
        {
          message: "Parameter 'obj' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutObj'.",
          type: 'Identifier'
        }
      ]
    },
    // ❌ Multiple parameters mutated
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
    // ❌ Nested functions
    {
      code: `
        function outerFunction(data) {
          function innerFunction() {
            data.modified = true;
          }
          innerFunction();
        }
      `,
      errors: [
        {
          message: "Parameter 'data' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mutData'.",
          type: 'Identifier'
        }
      ]
    }
  ]
});
