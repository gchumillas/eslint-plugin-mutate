const createMutRule = require('./rules/require-mut');

module.exports = {
  rules: {
    'require-mut-param': createMutRule('param'),
    'require-mut-var': createMutRule('var')
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