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
  },
  overrides: [
    {
      // Allow console.log in benchmark files
      files: ['benchmarks/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};