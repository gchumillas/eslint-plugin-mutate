const { ESLint } = require('eslint');
const path = require('path');

/**
 * Generate test case with many simple mutations
 */
function generateLargeTestCase(lines) {
  let code = 'function massive(mutData) {\n';
  for (let i = 0; i < lines; i++) {
    code += `  mutData.prop${i} = ${i};\n`;
    if (i % 10 === 0) {
      code += `  mutData.items.push(${i});\n`;
    }
    if (i % 20 === 0) {
      code += `  mutData.nested.deep.value${i} = 'test${i}';\n`;
    }
  }
  code += '  return mutData;\n}';
  return code;
}

/**
 * Generate deeply nested functions with mutations
 */
function generateNestedFunctions(depth) {
  let code = 'function outer(mutData) {\n';
  let indent = '  ';
  
  for (let i = 0; i < depth; i++) {
    code += indent + `function level${i}(mutParam${i}) {\n`;
    code += indent + '  ' + `mutParam${i}.value = ${i};\n`;
    code += indent + '  ' + `mutData.level${i} = 'modified';\n`;
    indent += '  ';
  }
  
  // Call all nested functions
  for (let i = 0; i < depth; i++) {
    code += indent + `level${i}({});\n`;
  }
  
  // Close all functions
  for (let i = depth - 1; i >= 0; i--) {
    indent = indent.slice(2);
    code += indent + '}\n';
  }
  
  code += '  return mutData;\n}';
  return code;
}

/**
 * Generate complex real-world-like scenarios
 */
function generateComplexScenario() {
  return `
// Complex data processing function with multiple mutation patterns
function processUserData(mutUsers, mutConfig, mutCache) {
  // Array mutations
  mutUsers.forEach((user, index) => {
    // Property assignments
    user.lastUpdated = Date.now();
    user.profile.status = 'active';
    user.metadata.processedAt = new Date().toISOString();
    
    // Nested object mutations
    if (!user.settings) {
      user.settings = {};
    }
    user.settings.theme = mutConfig.defaultTheme;
    user.settings.notifications.email = true;
    
    // Conditional mutations
    if (user.type === 'premium') {
      user.features.push('advanced-analytics');
      user.features.sort();
    }
    
    // Cache mutations
    mutCache.users[user.id] = user;
    mutCache.lastAccess = Date.now();
  });
  
  // Configuration mutations
  mutConfig.totalProcessed++;
  mutConfig.stats.lastBatch = mutUsers.length;
  
  // Array method mutations
  mutUsers.sort((a, b) => a.priority - b.priority);
  mutUsers.splice(0, 0, { id: 'system', type: 'system' });
  
  // Nested function with mutations
  function updateMetrics(mutMetrics) {
    mutMetrics.processed += mutUsers.length;
    mutMetrics.timestamp = Date.now();
    
    function updateSubMetrics(mutSubMetrics) {
      mutSubMetrics.calls++;
      mutSubMetrics.lastCall = new Date();
    }
    
    updateSubMetrics(mutMetrics.sub);
  }
  
  updateMetrics(mutConfig.metrics);
  
  return {
    users: mutUsers,
    config: mutConfig,
    cache: mutCache
  };
}

// TypeScript-style function (will be tested with .ts extension)
function processTypedData(mutData: Mut<DataType>, config: ConfigType): ResultType {
  mutData.items.forEach(item => {
    item.processed = true;
    item.metadata.timestamp = Date.now();
  });
  
  mutData.summary.total = mutData.items.length;
  mutData.summary.lastUpdated = new Date();
  
  return mutData;
}

// Edge case: Multiple parameters with same root name
function confusingNames(mutUser, mutUserData, mutUserConfig) {
  mutUser.name = 'changed';
  mutUserData.profile = {};
  mutUserConfig.settings.updated = true;
}

// Edge case: Arrow functions with mutations
const processItems = (mutItems) => {
  mutItems.forEach(item => item.processed = true);
  mutItems.sort((a, b) => a.priority - b.priority);
  return mutItems;
};

// Edge case: Class methods
class DataProcessor {
  processData(mutData, config) {
    mutData.processed = true;
    mutData.items.push({ type: 'system' });
    
    const helper = (mutHelperData) => {
      mutHelperData.helper = true;
    };
    
    helper(mutData);
  }
}
`;
}

/**
 * Test cases with different complexity levels
 */
const testCases = {
  tiny: `
    function simple(user) {
      user.name = 'test';
      return user;
    }
  `,
  
  small: `
    function updateUser(mutUser, config) {
      mutUser.name = config.name;
      mutUser.profile.updated = true;
      mutUser.settings.theme = 'dark';
      return mutUser;
    }
  `,
  
  medium: `
    function processData(mutData, mutConfig) {
      mutData.items.forEach(item => {
        item.processed = true;
        item.metadata.timestamp = Date.now();
      });
      
      if (mutConfig.sort) {
        mutData.items.sort((a, b) => a.id - b.id);
      }
      
      mutConfig.lastRun = Date.now();
      mutConfig.stats.runs++;
      
      return mutData;
    }
  `,
  
  large: generateLargeTestCase(500),
  
  nested: generateNestedFunctions(8),
  
  complex: generateComplexScenario(),
  
  typescript: `
    function processTypedData(mutData: Mut<DataType>): ResultType {
      mutData.items.forEach(item => {
        item.processed = true;
        item.metadata.timestamp = Date.now();
      });
      
      mutData.summary.total = mutData.items.length;
      return mutData as ResultType;
    }
  `
};

/**
 * Performance measurement utilities
 */
class PerformanceTracker {
  constructor() {
    this.measurements = new Map();
  }
  
  start(label) {
    this.measurements.set(label, process.hrtime.bigint());
  }
  
  end(label) {
    const start = this.measurements.get(label);
    if (!start) {
      throw new Error(`No start time found for label: ${label}`);
    }
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    this.measurements.delete(label);
    return duration;
  }
}

/**
 * Main benchmark runner
 */
async function runBenchmark(options = {}) {
  const {
    iterations = { tiny: 1000, small: 500, medium: 100, large: 50, nested: 100, complex: 20, typescript: 100 },
    verbose = false,
    onlyRules = null // ['require-mut-param', 'require-mut-var'] or null for all
  } = options;
  
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: {
      plugins: ['mutate'],
      rules: onlyRules ? Object.fromEntries(
        onlyRules.map(rule => [`mutate/${rule}`, 'error'])
      ) : {
        'mutate/require-mut-param': 'error',
        'mutate/require-mut-var': 'error'
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    resolvePluginsRelativeTo: path.resolve(__dirname, '..')
  });

  console.log('🚀 ESLint Plugin Mutate - Performance Benchmarks');
  console.log('='.repeat(60));
  console.log(`📊 Testing ${Object.keys(testCases).length} scenarios\n`);
  
  const results = {};
  const tracker = new PerformanceTracker();
  
  for (const [name, code] of Object.entries(testCases)) {
    const testIterations = iterations[name] || 50;
    const isTypeScript = name === 'typescript';
    const fileName = isTypeScript ? 'test.ts' : 'test.js';
    
    console.log(`📈 Testing ${name.toUpperCase()} case:`);
    console.log(`   Code size: ${code.length} characters`);
    console.log(`   Iterations: ${testIterations}`);
    
    if (verbose) {
      console.log(`   Preview: ${code.substring(0, 100).replace(/\n/g, '\\n')}...`);
    }
    
    const times = [];
    const memoryUsages = [];
    
    // Warmup run
    await eslint.lintText(code, { filePath: fileName });
    
    for (let i = 0; i < testIterations; i++) {
      const memBefore = process.memoryUsage().heapUsed;
      
      tracker.start(`${name}-${i}`);
      const result = await eslint.lintText(code, { filePath: fileName });
      const duration = tracker.end(`${name}-${i}`);
      
      const memAfter = process.memoryUsage().heapUsed;
      
      times.push(duration);
      memoryUsages.push(memAfter - memBefore);
      
      if (verbose && i === 0) {
        console.log(`   Errors found: ${result[0].messages.length}`);
      }
    }
    
    // Calculate statistics
    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    
    const avgMemory = memoryUsages.reduce((a, b) => a + b) / memoryUsages.length;
    const maxMemory = Math.max(...memoryUsages);
    
    results[name] = {
      avg, min, max, median, p95,
      avgMemory: avgMemory / 1024 / 1024, // Convert to MB
      maxMemory: maxMemory / 1024 / 1024,
      codeSize: code.length,
      iterations: testIterations
    };
    
    console.log(`   ⏱️  Average: ${avg.toFixed(2)}ms`);
    console.log(`   📊 Median:  ${median.toFixed(2)}ms`);
    console.log(`   ⚡ Min:     ${min.toFixed(2)}ms`);
    console.log(`   🔥 Max:     ${max.toFixed(2)}ms`);
    console.log(`   📈 95th %:  ${p95.toFixed(2)}ms`);
    console.log(`   💾 Memory:  ${(avgMemory / 1024 / 1024).toFixed(2)}MB avg, ${(maxMemory / 1024 / 1024).toFixed(2)}MB peak`);
    console.log(`   🔢 Total:   ${(avg * testIterations).toFixed(2)}ms for ${testIterations} runs\n`);
  }
  
  // Summary
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  const sortedByAvg = Object.entries(results).sort((a, b) => b[1].avg - a[1].avg);
  
  console.log('🐌 Slowest to fastest (average time):');
  sortedByAvg.forEach(([name, stats], index) => {
    const emoji = index === 0 ? '🐌' : index === sortedByAvg.length - 1 ? '⚡' : '📊';
    console.log(`   ${emoji} ${name.padEnd(12)}: ${stats.avg.toFixed(2)}ms avg`);
  });
  
  console.log('\n💾 Memory usage by case:');
  const sortedByMemory = Object.entries(results).sort((a, b) => b[1].avgMemory - a[1].avgMemory);
  sortedByMemory.forEach(([name, stats]) => {
    console.log(`   📦 ${name.padEnd(12)}: ${stats.avgMemory.toFixed(2)}MB avg`);
  });
  
  // Performance insights
  console.log('\n🎯 Performance Insights:');
  const largestCode = Math.max(...Object.values(results).map(r => r.codeSize));
  const fastestPerChar = Object.entries(results).reduce((best, [name, stats]) => {
    const timePerChar = stats.avg / stats.codeSize;
    return !best || timePerChar < best.ratio ? { name, ratio: timePerChar } : best;
  }, null);
  
  console.log(`   📏 Largest test case: ${largestCode} characters`);
  console.log(`   ⚡ Most efficient: ${fastestPerChar.name} (${(fastestPerChar.ratio * 1000).toFixed(3)}ms per 1000 chars)`);
  
  const totalTime = Object.values(results).reduce((sum, stats) => sum + (stats.avg * stats.iterations), 0);
  console.log(`   ⏱️  Total benchmark time: ${(totalTime / 1000).toFixed(2)} seconds`);
  
  return results;
}

/**
 * Export for use in other scripts
 */
module.exports = {
  runBenchmark,
  testCases,
  generateLargeTestCase,
  generateNestedFunctions,
  generateComplexScenario,
  PerformanceTracker
};

/**
 * Run benchmarks if called directly
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--verbose')) {
    options.verbose = true;
  }
  
  if (args.includes('--param-only')) {
    options.onlyRules = ['require-mut-param'];
  }
  
  if (args.includes('--var-only')) {
    options.onlyRules = ['require-mut-var'];
  }
  
  runBenchmark(options).catch(console.error);
}
