module.exports = {
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-param-prefix': 'error',
    'mutate/require-mut-var-prefix': 'error'
  }
  // You can also use the recommended configuration:
  // extends: ['plugin:mutate/recommended']
};