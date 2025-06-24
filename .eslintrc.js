module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Basic rules for plugin development
    'no-unused-vars': 'error',
    'no-console': 'warn'
  }
};