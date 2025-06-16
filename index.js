module.exports = {
  rules: {
    'require-mut-param-prefix': require('./rules/require-mut-param-prefix'),
    'require-mut-var-prefix': require('./rules/require-mut-var-prefix')
  },
  configs: {
    recommended: {
      plugins: ['mutate'],
      rules: {
        'mutate/require-mut-param-prefix': 'error',
        'mutate/require-mut-var-prefix': 'error'
      }
    }
  }
};