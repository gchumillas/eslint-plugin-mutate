const { RuleTester } = require('eslint');
const createMutRule = require('../../rules/require-mut');
const rule = createMutRule('var');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

ruleTester.run('require-mut-var', rule, {
  valid: [
    // ✅ Correctly passing variables with mut prefix to functions that mutate
    {
      code: `
        function updateUser(mutUser) {
          mutUser.lastLogin = new Date();
        }
        
        function processData() {
          const mutUserData = { name: 'John' };
          updateUser(mutUserData);
        }
      `,
      options: []
    },
    {
      code: `
        function addItem(mutList, item) {
          mutList.push(item);
        }
        
        function main() {
          const mutItems = [];
          addItem(mutItems, 'new item');
        }
      `,
      options: []
    },
    {
      code: `
        const updateUser = (mutUser) => {
          mutUser.lastLogin = new Date();
        };
        
        const processData = () => {
          const mutUserData = { name: 'John' };
          updateUser(mutUserData);
        };
      `,
      options: []
    },
    {
      code: `
        const addItem = (mutList, item) => {
          mutList.push(item);
        };
        
        const main = () => {
          const mutItems = [];
          addItem(mutItems, 'new item');
        };
      `,
      options: []
    },
    // ✅ Functions without mut parameters (no cross-function check needed)
    {
      code: `
        function readData(data) {
          return data.length;
        }
        
        function main() {
          const items = [1, 2, 3];
          readData(items);
        }
      `,
      options: []
    },
    // ✅ Passing non-identifier arguments (literals, expressions)
    {
      code: `
        function updateUser(mutUser) {
          mutUser.status = 'active';
        }
        
        function test() {
          updateUser({ name: 'John' }); // Object literal - no check needed
          updateUser(createUser());      // Function call - no check needed
        }
      `,
      options: []
    }
  ],

  invalid: [
    // ❌ Passing variable without mut prefix to function that mutates
    {
      code: `
        function updateUser(mutUser) {
          mutUser.lastLogin = new Date();
        }
        
        function processData() {
          const userData = { name: 'John' };
          updateUser(userData);
        }
      `,
      errors: [
        {
          message: "Argument 'userData' is passed to function 'updateUser' which mutates this parameter. Consider renaming to 'mutUserData'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        function addItems(mutList, item) {
          mutList.push(item);
        }
        
        function main() {
          const items = [];
          addItems(items, 'new item');
        }
      `,
      errors: [
        {
          message: "Argument 'items' is passed to function 'addItems' which mutates this parameter. Consider renaming to 'mutItems'.",
          type: 'Identifier'
        }
      ]
    },
    // ❌ Arrow functions without mut prefix
    {
      code: `
        const updateUser = (mutUser) => {
          mutUser.lastLogin = new Date();
        };
        
        const processData = () => {
          const userData = { name: 'John' };
          updateUser(userData);
        };
      `,
      errors: [
        {
          message: "Argument 'userData' is passed to function 'updateUser' which mutates this parameter. Consider renaming to 'mutUserData'.",
          type: 'Identifier'
        }
      ]
    },
    {
      code: `
        const modifyBoth = (mutArray, mutOptions) => {
          mutArray.sort();
          mutOptions.sorted = true;
        };
        
        const process = () => {
          const data = [3, 1, 2];
          const options = { sorted: false };
          modifyBoth(data, options);
        };
      `,
      errors: [
        {
          message: "Argument 'data' is passed to function 'modifyBoth' which mutates this parameter. Consider renaming to 'mutData'.",
          type: 'Identifier'
        },
        {
          message: "Argument 'options' is passed to function 'modifyBoth' which mutates this parameter. Consider renaming to 'mutOptions'.",
          type: 'Identifier'
        }
      ]
    },
    // ❌ Mixed: regular function and arrow function
    {
      code: `
        function updateUser(mutUser) {
          mutUser.status = 'active';
        }
        
        const processArray = (mutArray) => {
          mutArray.push('item');
        };
        
        const main = () => {
          const userData = { name: 'John' };
          const items = [];
          
          updateUser(userData);
          processArray(items);
        };
      `,
      errors: [
        {
          message: "Argument 'userData' is passed to function 'updateUser' which mutates this parameter. Consider renaming to 'mutUserData'.",
          type: 'Identifier'
        },
        {
          message: "Argument 'items' is passed to function 'processArray' which mutates this parameter. Consider renaming to 'mutItems'.",
          type: 'Identifier'
        }
      ]
    }
  ]
});
