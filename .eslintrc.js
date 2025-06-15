module.exports = {
  plugins: ['mutate'],
  rules: {
    'mutate/require-mut-prefix': 'error'
  },
  // También puedes usar la configuración recomendada:
  // extends: ['plugin:mutate/recommended']
};