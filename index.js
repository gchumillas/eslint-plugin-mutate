module.exports = {
  rules: {
    'require-mut-param': require('./rules/require-mut-param'),
    'require-mut-var': require('./rules/require-mut-var')
  },
  configs: {
    recommended: {
      plugins: ['mutate'],
      rules: {
        'mutate/require-mut-param': 'error',
        'mutate/require-mut-var': 'error'
      }
    }
  }
};