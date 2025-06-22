module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-param-prefix': 'error',
    'mutate/require-mut-var-prefix': 'error'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  // You can also use the recommended configuration:
  // extends: ['plugin:mutate/recommended']
};