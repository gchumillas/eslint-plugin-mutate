// Simplified benchmark that works with local plugin development
// Bypasses ESLint plugin loading and directly tests rule performance

const requireMutParam = require('../rules/require-mut-param');
const requireMutVar = require('../rules/require-mut-var');
const { parse } = require('@babel/parser');

/**
 * Generate test cases for direct rule testing
 */
const testCases = {
  tiny: `
    function simple(user) {
      user.name = 'test';
      return user;
    }
  `,
  
  small: `
    function updateUser(user, config) {
      user.name = config.name;
      user.profile.updated = true;
      user.settings.theme = 'dark';
      return user;
    }
  `,
  
  medium: `
    function processData(data, config) {
      data.items.forEach(item => {
        item.processed = true;
        item.metadata.timestamp = Date.now();
      });
      
      if (config.sort) {
        data.items.sort((a, b) => a.id - b.id);
      }
      
      config.lastRun = Date.now();
      config.stats.runs++;
      
      return data;
    }
  `,
  
  large: generateLargeFunction(300),
  
  nested: generateNestedFunctions(6),
  
  complex: `
    function processUserData(users, config, cache) {
      users.forEach((user, index) => {
        user.lastUpdated = Date.now();
        user.profile.status = 'active';
        user.metadata.processedAt = new Date().toISOString();
        
        if (!user.settings) {
          user.settings = {};
        }
        user.settings.theme = config.defaultTheme;
        user.settings.notifications.email = true;
        
        if (user.type === 'premium') {
          user.features.push('advanced-analytics');
          user.features.sort();
        }
        
        cache.users[user.id] = user;
        cache.lastAccess = Date.now();
      });
      
      config.totalProcessed++;
      config.stats.lastBatch = users.length;
      
      users.sort((a, b) => a.priority - b.priority);
      users.splice(0, 0, { id: 'system', type: 'system' });
      
      function updateMetrics(metrics) {
        metrics.processed += users.length;
        metrics.timestamp = Date.now();
        
        function updateSubMetrics(subMetrics) {
          subMetrics.calls++;
          subMetrics.lastCall = new Date();
        }
        
        updateSubMetrics(metrics.sub);
      }
      
      updateMetrics(config.metrics);
      
      return { users, config, cache };
    }
  `
};

function generateLargeFunction(mutations) {
  let code = 'function processLargeData(data) {\n';
  for (let i = 0; i < mutations; i++) {
    code += `  data.prop${i} = ${i};\n`;
    if (i % 10 === 0) {
      code += `  data.items.push(${i});\n`;
    }
    if (i % 20 === 0) {
      code += `  data.nested.deep.value${i} = 'test${i}';\n`;
    }
  }
  code += '  return data;\n}';
  return code;
}

function generateNestedFunctions(depth) {
  let code = 'function outer(data) {\n';
  for (let i = 0; i < depth; i++) {
    code += '  '.repeat(i + 1) + `function level${i}() {\n`;
    code += '  '.repeat(i + 2) + `data.level${i} = 'modified';\n`;
  }
  for (let i = depth - 1; i >= 0; i--) {
    code += '  '.repeat(i + 2) + `level${i}();\n`;
    code += '  '.repeat(i + 1) + '}\n';
  }
  code += '  return data;\n}';
  return code;
}

/**
 * Mock ESLint context for direct rule testing
 */
function createMockContext() {
  const reports = [];
  return {
    report: (report) => reports.push(report),
    getFilename: () => 'test.js',
    getScope: () => ({}),
    getDeclaredVariables: () => [],
    getSourceCode: () => ({
      getText: () => '',
      getTokens: () => [],
      getComments: () => []
    }),
    reports // Access to collected reports
  };
}

/**
 * Walk AST and call rule visitors
 */
function walkAST(node, visitors, context) {
  if (!node || typeof node !== 'object') return;
  
  // Call appropriate visitors for this node
  Object.keys(visitors).forEach(selector => {
    if (matchesSelector(node, selector)) {
      try {
        visitors[selector].call(context, node);
      } catch (error) {
        // Ignore errors during testing
      }
    }
  });
  
  // Walk child nodes
  Object.values(node).forEach(child => {
    if (Array.isArray(child)) {
      child.forEach(item => walkAST(item, visitors, context));
    } else if (child && typeof child === 'object' && child.type) {
      walkAST(child, visitors, context);
    }
  });
  
  // Call exit visitors
  Object.keys(visitors).forEach(selector => {
    if (selector.endsWith(':exit') && matchesSelector(node, selector.replace(':exit', ''))) {
      try {
        visitors[selector].call(context, node);
      } catch (error) {
        // Ignore errors during testing
      }
    }
  });
}

/**
 * Simple selector matching
 */
function matchesSelector(node, selector) {
  if (!node.type) return false;
  
  if (selector === node.type) return true;
  
  if (selector.includes(',')) {
    return selector.split(',').some(s => s.trim() === node.type);
  }
  
  return false;
}

/**
 * Direct rule performance testing
 */
async function runDirectBenchmarks() {
  console.log('🎯 Direct Rule Performance Benchmarks');
  console.log('='.repeat(60));
  console.log('📊 Testing rule performance without ESLint overhead\n');
  
  const results = {};
  
  for (const [caseName, code] of Object.entries(testCases)) {
    console.log(`📈 Testing ${caseName.toUpperCase()} case:`);
    console.log(`   Code size: ${code.length} characters`);
    
    // Parse code once
    let ast;
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });
    } catch (error) {
      console.log(`   ⚠️  Parse error: ${error.message}`);
      continue;
    }
    
    // Test require-mut-param rule
    const paramTimes = [];
    const iterations = caseName === 'large' ? 50 : caseName === 'complex' ? 20 : 200;
    
    for (let i = 0; i < iterations; i++) {
      const context = createMockContext();
      const start = process.hrtime.bigint();
      
      const ruleInstance = requireMutParam.create(context);
      walkAST(ast, ruleInstance, context);
      
      const end = process.hrtime.bigint();
      paramTimes.push(Number(end - start) / 1000000); // Convert to ms
    }
    
    // Test require-mut-var rule
    const varTimes = [];
    for (let i = 0; i < iterations; i++) {
      const context = createMockContext();
      const start = process.hrtime.bigint();
      
      const ruleInstance = requireMutVar.create(context);
      walkAST(ast, ruleInstance, context);
      
      const end = process.hrtime.bigint();
      varTimes.push(Number(end - start) / 1000000);
    }
    
    // Calculate statistics
    const paramAvg = paramTimes.reduce((a, b) => a + b) / paramTimes.length;
    const varAvg = varTimes.reduce((a, b) => a + b) / varTimes.length;
    const paramMedian = paramTimes.sort((a, b) => a - b)[Math.floor(paramTimes.length / 2)];
    const varMedian = varTimes.sort((a, b) => a - b)[Math.floor(varTimes.length / 2)];
    
    results[caseName] = {
      paramAvg, varAvg, paramMedian, varMedian,
      codeSize: code.length, iterations
    };
    
    console.log(`   📊 require-mut-param: ${paramAvg.toFixed(3)}ms avg, ${paramMedian.toFixed(3)}ms median`);
    console.log(`   📊 require-mut-var:   ${varAvg.toFixed(3)}ms avg, ${varMedian.toFixed(3)}ms median`);
    
    const faster = paramAvg < varAvg ? 'param' : 'var';
    const ratio = Math.max(paramAvg, varAvg) / Math.min(paramAvg, varAvg);
    console.log(`   🏆 ${faster} rule is ${ratio.toFixed(2)}x faster\n`);
  }
  
  // Summary
  console.log('📋 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  
  const totalParamTime = Object.values(results).reduce((sum, r) => sum + r.paramAvg, 0);
  const totalVarTime = Object.values(results).reduce((sum, r) => sum + r.varAvg, 0);
  
  console.log(`🎯 Overall averages:`);
  console.log(`   require-mut-param: ${(totalParamTime / Object.keys(results).length).toFixed(3)}ms`);
  console.log(`   require-mut-var:   ${(totalVarTime / Object.keys(results).length).toFixed(3)}ms`);
  
  const slowestCase = Object.entries(results).reduce((slowest, [name, stats]) => {
    const maxTime = Math.max(stats.paramAvg, stats.varAvg);
    return !slowest || maxTime > slowest.time ? { name, time: maxTime } : slowest;
  }, null);
  
  console.log(`\n🐌 Slowest case: ${slowestCase.name} (${slowestCase.time.toFixed(3)}ms)`);
  
  const fastestCase = Object.entries(results).reduce((fastest, [name, stats]) => {
    const minTime = Math.min(stats.paramAvg, stats.varAvg);
    return !fastest || minTime < fastest.time ? { name, time: minTime } : fastest;
  }, null);
  
  console.log(`⚡ Fastest case: ${fastestCase.name} (${fastestCase.time.toFixed(3)}ms)`);
  
  return results;
}

/**
 * Memory usage test
 */
function profileMemoryUsage() {
  console.log('\n💾 MEMORY USAGE PROFILING');
  console.log('-'.repeat(50));
  
  const iterations = 5000;
  const startMemory = process.memoryUsage();
  
  console.log(`🔄 Running ${iterations} rule executions...`);
  
  for (let i = 0; i < iterations; i++) {
    const context = createMockContext();
    const ruleInstance = requireMutParam.create(context);
    
    // Simulate some work
    const mockNode = {
      type: 'FunctionDeclaration',
      params: [{ type: 'Identifier', name: 'user' }]
    };
    
    if (ruleInstance['FunctionDeclaration']) {
      ruleInstance['FunctionDeclaration'](mockNode);
    }
    
    if (i % 1000 === 0 && global.gc) {
      global.gc();
    }
  }
  
  const endMemory = process.memoryUsage();
  
  console.log('📊 Memory Usage Results:');
  console.log(`   Heap Used: ${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Heap Total: ${((endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   RSS: ${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Per execution: ${((endMemory.heapUsed - startMemory.heapUsed) / iterations / 1024).toFixed(2)}KB`);
}

module.exports = {
  runDirectBenchmarks,
  profileMemoryUsage,
  testCases
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  runDirectBenchmarks().then(() => {
    if (args.includes('--memory')) {
      profileMemoryUsage();
    }
  }).catch(console.error);
}
