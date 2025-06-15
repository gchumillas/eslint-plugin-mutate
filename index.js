module.exports = {
  rules: {
    'require-mut-prefix': require('./rules/require-mut-prefix')
  },
  configs: {
    recommended: {
      plugins: ['mutate'],
      rules: {
        'mutate/require-mut-prefix': 'error'
      }
    }
  }
};