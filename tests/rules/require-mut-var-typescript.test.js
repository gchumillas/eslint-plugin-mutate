const { RuleTester } = require('eslint');
const createMutRule = require('../../rules/require-mut');
const rule = createMutRule('var');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('require-mut-var (TypeScript Variables)', rule, {
  valid: [
    // ✅ Variable with Mut<T> type (should pass)
    {
      code: `
        function updateUser(user: Mut<{name: string}>) {
          user.name = 'Updated';
        }
        
        const user: Mut<{name: string}> = { name: 'John' };
        updateUser(user);
      `,
      filename: 'test.ts',
    },
    
    // ✅ Variable with mut prefix (fallback, should pass)
    {
      code: `
        function updateUser(user: Mut<{name: string}>) {
          user.name = 'Updated';
        }
        
        const mutUser = { name: 'John' };
        updateUser(mutUser);
      `,
      filename: 'test.ts',
    },

    // ✅ Read-only function (should pass)
    {
      code: `
        function readUser(user: {name: string}) {
          return user.name;
        }
        
        const user = { name: 'John' };
        readUser(user);
      `,
      filename: 'test.ts',
    },
  ],

  invalid: [
    // ❌ Variable without Mut<T> type or mut prefix (should error)
    {
      code: `
        function updateUser(user: Mut<{name: string}>) {
          user.name = 'Updated';
        }
        
        const user = { name: 'John' };
        updateUser(user);
      `,
      filename: 'test.ts',
      errors: [
        {
          message: "Argument 'user' is passed to function 'updateUser' which mutates this parameter. Consider using 'Mut<T>' type annotation or renaming to 'mutUser'.",
        },
      ],
    },
  ],
});
