const assert = require('assert');
const plugin = require('../index');

describe('eslint-plugin-mutate', () => {
  describe('plugin structure', () => {
    it('should export rules object', () => {
      assert(plugin.rules);
      assert(typeof plugin.rules === 'object');
    });

    it('should export require-mut-prefix rule', () => {
      assert(plugin.rules['require-mut-prefix']);
      assert(typeof plugin.rules['require-mut-prefix'] === 'object');
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
      assert(recommended.rules['mutate/require-mut-prefix'] === 'error');
    });
  });

  describe('rule metadata', () => {
    const rule = plugin.rules['require-mut-prefix'];

    it('should have correct metadata', () => {
      assert(rule.meta);
      assert(rule.meta.type === 'problem');
      assert(rule.meta.docs);
      assert(rule.meta.docs.description);
      assert(rule.meta.docs.category === 'Best Practices');
      assert(rule.meta.docs.recommended === true);
    });

    it('should have create function', () => {
      assert(typeof rule.create === 'function');
    });

    it('should have schema array', () => {
      assert(Array.isArray(rule.meta.schema));
    });

    it('should not be fixable', () => {
      assert(rule.meta.fixable === null);
    });
  });
});