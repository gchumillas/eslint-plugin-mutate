const { RuleTester } = require('eslint');
const rule = require('../../rules/require-mut-param');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('require-mut-param (TypeScript)', rule, {
  valid: [
    // ✅ Parameters with Mut<T> type that are correctly mutated
    {
      code: `
        function doSomething(items: Mut<number[]>) {
          items.push(4);
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        function processUser(user: Mut<{name: string; age: number}>) {
          user.name = 'John';
          user.age++;
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        const updateArray = (data: Mut<string[]>) => {
          data.pop();
          data.shift();
          data.sort();
        };
      `,
      filename: 'test.ts',
    },
    {
      code: `
        function modifyObject(obj: Mut<{count: number}>) {
          obj.count = 42;
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        function deepMutation(user: Mut<{profile: {name: string}}>) {
          user.profile.name = 'Jane';
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        async function asyncMutation(items: Mut<any[]>) {
          items.splice(0, 1);
        }
      `,
      filename: 'test.ts',
    },
    // ✅ Parameters without Mut<T> type that are NOT mutated (read-only)
    {
      code: `
        function readOnly(items: number[]) {
          console.log(items.length);
          console.log(items[0]);
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        function calculateSum(numbers: number[]) {
          return numbers.reduce((sum, num) => sum + num, 0);
        }
      `,
      filename: 'test.ts',
    },
    {
      code: `
        function logUser(user: {name: string}) {
          console.log(user.name);
        }
      `,
      filename: 'test.ts',
    },
    // ✅ Mixed parameters - only mutable ones need Mut<T>
    {
      code: `
        function processData(readOnlyData: string[], mutResults: Mut<number[]>) {
          console.log(readOnlyData.length);
          mutResults.push(42);
        }
      `,
      filename: 'test.ts',
    },
    // ✅ Nested functions
    {
      code: `
        function outer(data: Mut<any[]>) {
          data.push(1);
          
          function inner(items: number[]) {
            console.log(items.length);
          }
          
          inner(data);
        }
      `,
      filename: 'test.ts',
    },
  ],

  invalid: [
    // ❌ Parameters mutated without Mut<T> type
    {
      code: `
        function doSomething(items: number[]) {
          items.push(4);
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'items' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    {
      code: `
        function processUser(user: {name: string}) {
          user.name = 'John';
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'user' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    {
      code: `
        const updateCounter = (counter: {value: number}) => {
          counter.value++;
        };
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'counter' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    {
      code: `
        function modifyArray(arr: string[]) {
          arr.pop();
          arr.sort();
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'arr' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    {
      code: `
        function deepMutation(obj: {nested: {prop: string}}) {
          obj.nested.prop = 'new value';
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'obj' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    {
      code: `
        async function asyncMutation(data: any[]) {
          data.splice(0, 1);
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'data' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    // ❌ Multiple parameters with mutations
    {
      code: `
        function multiMutation(arr1: number[], arr2: string[]) {
          arr1.push(1);
          arr2.pop();
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'arr1' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
        {
          message: "Parameter 'arr2' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
    // ❌ Nested function mutations
    {
      code: `
        function outer(data: any[]) {
          function inner() {
            data.push(1);
          }
          inner();
        }
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Parameter 'data' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.",
        },
      ],
    },
  ],
});
