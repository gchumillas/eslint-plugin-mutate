const { RuleTester } = require('eslint');
const requireMutParam = require('../rules/require-mut-param');
const requireMutVar = require('../rules/require-mut-var');

/**
 * Focused performance tests for individual rules
 */
class RulePerformanceTester {
  constructor() {
    this.measurements = new Map();
  }
  
  /**
   * Test rule performance in isolation
   */
  testRulePerformance(rule, testCases, options = {}) {
    const { iterations = 1000, ruleName = 'unknown' } = options;
    
    console.log(`🎯 Testing ${ruleName} rule performance`);
    console.log('-'.repeat(50));
    
    const results = {};
    
    Object.entries(testCases).forEach(([caseName, code]) => {
      console.log(`  📊 Testing ${caseName}...`);
      
      const times = [];
      
      // Create a mock context for the rule
      const mockContext = {
        report: () => {},
        getFilename: () => caseName.includes('typescript') ? 'test.ts' : 'test.js',
        getScope: () => ({}),
        getDeclaredVariables: () => [],
        getSourceCode: () => ({
          getText: () => code,
          getTokens: () => [],
          getComments: () => []
        })
      };
      
      // Parse the code once to get AST
      const { parse } = require('@babel/parser');
      let ast;
      try {
        ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx']
        });
      } catch (error) {
        console.log(`    ⚠️  Parse error: ${error.message}`);
        return;
      }
      
      // Warmup
      const ruleInstance = rule.create(mockContext);
      this.simulateRuleExecution(ruleInstance, ast);
      
      // Actual measurements
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        
        const ruleInstance = rule.create(mockContext);
        this.simulateRuleExecution(ruleInstance, ast);
        
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // Convert to ms
      }
      
      // Calculate stats
      const avg = times.reduce((a, b) => a + b) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
      
      results[caseName] = { avg, min, max, median, iterations };
      
      console.log(`    ⏱️  Average: ${avg.toFixed(4)}ms`);
      console.log(`    📊 Median:  ${median.toFixed(4)}ms`);
      console.log(`    ⚡ Range:   ${min.toFixed(4)}ms - ${max.toFixed(4)}ms`);
    });
    
    return results;
  }
  
  /**
   * Simulate rule execution by walking the AST
   */
  simulateRuleExecution(ruleInstance, ast) {
    const nodeQueue = [ast];
    
    while (nodeQueue.length > 0) {
      const node = nodeQueue.shift();
      
      if (!node || typeof node !== 'object') continue;
      
      // Simulate calling rule visitors
      Object.keys(ruleInstance).forEach(selector => {
        if (this.nodeMatchesSelector(node, selector)) {
          try {
            ruleInstance[selector](node);
          } catch (error) {
            // Ignore errors in simulation
          }
        }
      });
      
      // Add child nodes to queue
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          nodeQueue.push(...value);
        } else if (value && typeof value === 'object' && value.type) {
          nodeQueue.push(value);
        }
      });
    }
  }
  
  /**
   * Simple selector matching (basic implementation)
   */
  nodeMatchesSelector(node, selector) {
    if (!node.type) return false;
    
    // Handle simple selectors like 'FunctionDeclaration' or 'AssignmentExpression'
    if (selector === node.type) return true;
    
    // Handle compound selectors like 'FunctionDeclaration, FunctionExpression'
    if (selector.includes(',')) {
      return selector.split(',').some(s => s.trim() === node.type);
    }
    
    // Handle :exit selectors
    if (selector.endsWith(':exit')) {
      const baseSelector = selector.replace(':exit', '').trim();
      return this.nodeMatchesSelector(node, baseSelector);
    }
    
    return false;
  }
}

/**
 * Benchmark test cases for rule performance
 */
const ruleTestCases = {
  simple: `
    function test(user) {
      user.name = 'test';
    }
  `,
  
  complex: `
    function processData(data, config) {
      data.items.forEach(item => {
        item.processed = true;
        item.metadata.timestamp = Date.now();
      });
      config.lastRun = Date.now();
    }
  `,
  
  nested: `
    function outer(mutData) {
      function inner() {
        function deep() {
          mutData.value = 'changed';
        }
        deep();
      }
      inner();
    }
  `,
  
  typescript: `
    function processTypedData(mutData: Mut<DataType>): void {
      mutData.items.forEach(item => {
        item.processed = true;
      });
    }
  `,
  
  manyParams: `
    function manyParams(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10) {
      p1.value = 1;
      p3.value = 3;
      p5.value = 5;
      p7.value = 7;
      p9.value = 9;
    }
  `,
  
  deepNesting: `
    function level1(mutData) {
      mutData.l1 = true;
      function level2() {
        mutData.l2 = true;
        function level3() {
          mutData.l3 = true;
          function level4() {
            mutData.l4 = true;
            function level5() {
              mutData.l5 = true;
            }
            level5();
          }
          level4();
        }
        level3();
      }
      level2();
    }
  `
};

/**
 * Run rule-specific benchmarks
 */
async function runRuleBenchmarks() {
  console.log('🎯 ESLint Rule Performance Benchmarks');
  console.log('='.repeat(60));
  
  const tester = new RulePerformanceTester();
  
  // Test require-mut-param rule
  console.log('\n📋 REQUIRE-MUT-PARAM RULE');
  const paramResults = tester.testRulePerformance(
    requireMutParam,
    ruleTestCases,
    { iterations: 1000, ruleName: 'require-mut-param' }
  );
  
  // Test require-mut-var rule
  console.log('\n📋 REQUIRE-MUT-VAR RULE');
  const varResults = tester.testRulePerformance(
    requireMutVar,
    ruleTestCases,
    { iterations: 1000, ruleName: 'require-mut-var' }
  );
  
  // Compare rule performance
  console.log('\n🔍 RULE COMPARISON');
  console.log('-'.repeat(50));
  
  Object.keys(ruleTestCases).forEach(caseName => {
    const paramTime = paramResults[caseName]?.avg || 0;
    const varTime = varResults[caseName]?.avg || 0;
    const faster = paramTime < varTime ? 'param' : 'var';
    const ratio = Math.max(paramTime, varTime) / Math.min(paramTime, varTime);
    
    console.log(`  📊 ${caseName}:`);
    console.log(`     require-mut-param: ${paramTime.toFixed(4)}ms`);
    console.log(`     require-mut-var:   ${varTime.toFixed(4)}ms`);
    console.log(`     🏆 ${faster} rule is ${ratio.toFixed(2)}x faster`);
  });
  
  return { paramResults, varResults };
}

/**
 * Memory usage profiling
 */
function profileMemoryUsage() {
  console.log('\n💾 MEMORY USAGE PROFILING');
  console.log('-'.repeat(50));
  
  const startMemory = process.memoryUsage();
  
  // Simulate heavy rule usage
  const iterations = 10000;
  const tester = new RulePerformanceTester();
  
  console.log(`  🔄 Running ${iterations} iterations...`);
  
  for (let i = 0; i < iterations; i++) {
    const mockContext = {
      report: () => {},
      getFilename: () => 'test.js'
    };
    
    // Create rule instances
    const paramRule = requireMutParam.create(mockContext);
    const varRule = requireMutVar.create(mockContext);
    
    // Simulate some work
    if (i % 1000 === 0 && global.gc) {
      global.gc(); // Force garbage collection if available
    }
  }
  
  const endMemory = process.memoryUsage();
  
  console.log('  📊 Memory Usage:');
  console.log(`     Heap Used: ${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`     Heap Total: ${((endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024).toFixed(2)}MB`);
  console.log(`     RSS: ${((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2)}MB`);
}

module.exports = {
  RulePerformanceTester,
  runRuleBenchmarks,
  profileMemoryUsage,
  ruleTestCases
};

/**
 * Run if called directly
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--memory')) {
    profileMemoryUsage();
  } else {
    runRuleBenchmarks().then(() => {
      if (args.includes('--memory')) {
        profileMemoryUsage();
      }
    }).catch(console.error);
  }
}
