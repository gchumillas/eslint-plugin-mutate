const assert = require('assert');
const plugin = require('../index');

describe('eslint-plugin-mutate', () => {
  describe('plugin structure', () => {
    it('should export rules object', () => {
      assert(plugin.rules);
      assert(typeof plugin.rules === 'object');
    });

    it('should export require-mut-param rule', () => {
      assert(plugin.rules['require-mut-param']);
      assert(typeof plugin.rules['require-mut-param'] === 'object');
    });

    it('should export require-mut-var rule', () => {
      assert(plugin.rules['require-mut-var']);
      assert(typeof plugin.rules['require-mut-var'] === 'object');
    });

    it('should export configs object', () => {
      assert(plugin.configs);
      assert(typeof plugin.configs === 'object');
    });

    it('should export recommended config', () => {
      assert(plugin.configs.recommended);
      assert(typeof plugin.configs.recommended === 'object');
    });

    it('should have correct recommended config structure', () => {
      const recommended = plugin.configs.recommended;
      
      assert(Array.isArray(recommended.plugins));
      assert(recommended.plugins.includes('mutate'));
      
      assert(recommended.rules);
      assert(recommended.rules['mutate/require-mut-param'] === 'error');
      assert(recommended.rules['mutate/require-mut-var'] === 'error');
    });
  });

  describe('rule metadata', () => {
    const paramRule = plugin.rules['require-mut-param'];
    const varRule = plugin.rules['require-mut-var'];

    it('should have correct param rule metadata', () => {
      assert(paramRule.meta);
      assert(paramRule.meta.type === 'problem');
      assert(paramRule.meta.docs);
      assert(paramRule.meta.docs.description);
      assert(paramRule.meta.docs.category === 'Best Practices');
      assert(paramRule.meta.docs.recommended === true);
    });

    it('should have correct var rule metadata', () => {
      assert(varRule.meta);
      assert(varRule.meta.type === 'problem');
      assert(varRule.meta.docs);
      assert(varRule.meta.docs.description);
      assert(varRule.meta.docs.category === 'Best Practices');
      assert(varRule.meta.docs.recommended === true);
    });

    it('should have create functions', () => {
      assert(typeof paramRule.create === 'function');
      assert(typeof varRule.create === 'function');
    });

    it('should have schema arrays', () => {
      assert(Array.isArray(paramRule.meta.schema));
      assert(Array.isArray(varRule.meta.schema));
    });

    it('should not be fixable', () => {
      assert(paramRule.meta.fixable === null);
      assert(varRule.meta.fixable === null);
    });
  });
});