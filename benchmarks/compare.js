const { runDirectBenchmarks } = require('./direct-benchmark');
const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Compare performance between different git commits
 */
async function compareVersions(options = {}) {
  const {
    commitCount = 2,
    outputFile = null
  } = options;
  
  console.log('🔄 Comparing performance across git commits...\n');
  
  // Get current commit info
  const currentCommit = execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
  const currentBranch = execSync('git branch --show-current').toString().trim();
  
  console.log(`📊 Current: ${currentCommit} (${currentBranch})`);
  
  const results = {};
  
  try {
    // Run benchmark for current version
    console.log('\n--- CURRENT VERSION ---');
    results.current = {
      commit: currentCommit,
      branch: currentBranch,
      results: adaptResultsForComparison(await runDirectBenchmarks())
    };
    
    // Compare with previous commits
    for (let i = 1; i < commitCount; i++) {
      try {
        const previousCommit = execSync(`git rev-parse HEAD~${i}`).toString().trim().slice(0, 7);
        console.log(`\n📊 Previous commit (HEAD~${i}): ${previousCommit}`);
        
        // Stash current changes, checkout previous, run benchmark
        const hasUncommittedChanges = execSync('git status --porcelain').toString().trim().length > 0;
        
        if (hasUncommittedChanges) {
          execSync('git stash push -m "benchmark-temp"');
        }
        
        execSync(`git checkout HEAD~${i}`);
        
        console.log(`\n--- VERSION HEAD~${i} ---`);
        results[`head_minus_${i}`] = {
          commit: previousCommit,
          results: adaptResultsForComparison(await runDirectBenchmarks())
        };
        
        // Return to current state
        execSync(`git checkout ${currentCommit}`);
        
        if (hasUncommittedChanges) {
          execSync('git stash pop');
        }
        
      } catch (error) {
        console.log(`\n⚠️  Cannot access HEAD~${i}: ${error.message}`);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error during comparison:', error.message);
    
    // Try to return to original state
    try {
      execSync(`git checkout ${currentCommit}`);
      if (execSync('git stash list').toString().includes('benchmark-temp')) {
        execSync('git stash pop');
      }
    } catch (recoveryError) {
      console.error('❌ Could not recover git state:', recoveryError.message);
    }
    
    throw error;
  }
  
  // Generate comparison report
  generateComparisonReport(results, outputFile);
  
  return results;
}

/**
 * Generate detailed comparison report
 */
function generateComparisonReport(results, outputFile = null) {
  console.log('\n🔍 PERFORMANCE COMPARISON');
  console.log('='.repeat(70));
  
  const versions = Object.keys(results);
  const testCases = Object.keys(results[versions[0]].results);
  
  // Compare each test case across versions
  testCases.forEach(testCase => {
    console.log(`\n📊 ${testCase.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    const improvements = [];
    const regressions = [];
    
    versions.forEach((version, index) => {
      const result = results[version].results[testCase];
      const commit = results[version].commit;
      
      console.log(`   ${version === 'current' ? '📍' : '📜'} ${commit}: ${result.avg.toFixed(2)}ms avg`);
      
      if (index > 0) {
        const previousResult = results[versions[0]].results[testCase];
        const change = ((result.avg - previousResult.avg) / previousResult.avg) * 100;
        
        if (change > 5) {
          regressions.push({ testCase, change, version: commit });
        } else if (change < -5) {
          improvements.push({ testCase, change: Math.abs(change), version: commit });
        }
      }
    });
    
    // Show significant changes
    if (improvements.length > 0) {
      console.log('   ✅ Improvements:');
      improvements.forEach(imp => {
        console.log(`      ${imp.change.toFixed(1)}% faster in ${imp.version}`);
      });
    }
    
    if (regressions.length > 0) {
      console.log('   ⚠️  Regressions:');
      regressions.forEach(reg => {
        console.log(`      ${reg.change.toFixed(1)}% slower in ${reg.version}`);
      });
    }
  });
  
  // Overall performance summary
  console.log('\n🎯 OVERALL SUMMARY');
  console.log('-'.repeat(40));
  
  versions.forEach(version => {
    const totalAvg = Object.values(results[version].results)
      .reduce((sum, result) => sum + result.avg, 0) / testCases.length;
    
    console.log(`   ${version === 'current' ? '📍' : '📜'} ${results[version].commit}: ${totalAvg.toFixed(2)}ms average across all tests`);
  });
  
  // Save detailed report if requested
  if (outputFile) {
    const report = {
      timestamp: new Date().toISOString(),
      comparison: results,
      summary: generateSummaryStats(results)
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${outputFile}`);
  }
}

/**
 * Generate summary statistics for the report
 */
function generateSummaryStats(results) {
  const versions = Object.keys(results);
  const summary = {};
  
  versions.forEach(version => {
    const versionResults = results[version].results;
    const avgTimes = Object.values(versionResults).map(r => r.avg);
    const totalMemory = Object.values(versionResults).reduce((sum, r) => sum + r.avgMemory, 0);
    
    summary[version] = {
      commit: results[version].commit,
      avgTime: avgTimes.reduce((a, b) => a + b) / avgTimes.length,
      totalMemory,
      testCounts: Object.keys(versionResults).length
    };
  });
  
  return summary;
}

/**
 * Quick performance regression check for CI
 */
async function regressionCheck(thresholdPercent = 20) {
  console.log(`🔍 Running regression check (threshold: ${thresholdPercent}%)`);
  
  try {
    const results = await compareVersions({ commitCount: 2, verbose: false });
    
    if (Object.keys(results).length < 2) {
      console.log('✅ No previous commit to compare against');
      return true;
    }
    
    const current = results.current.results;
    const previous = results.head_minus_1.results;
    
    let hasRegression = false;
    
    Object.keys(current).forEach(testCase => {
      const currentTime = current[testCase].avg;
      const previousTime = previous[testCase].avg;
      const change = ((currentTime - previousTime) / previousTime) * 100;
      
      if (change > thresholdPercent) {
        console.log(`❌ Regression detected in ${testCase}: ${change.toFixed(1)}% slower`);
        hasRegression = true;
      }
    });
    
    if (hasRegression) {
      console.log('❌ Performance regression detected!');
      process.exit(1);
    } else {
      console.log('✅ No significant performance regressions detected');
      return true;
    }
    
  } catch (error) {
    console.log(`⚠️  Could not run regression check: ${error.message}`);
    return false;
  }
}

/**
 * Adapter function to convert direct benchmark results to comparison format
 */
function adaptResultsForComparison(directResults) {
  const adaptedResults = {};
  
  Object.entries(directResults).forEach(([caseName, stats]) => {
    // Use the faster time as the main metric for comparison
    const avg = Math.min(stats.paramAvg, stats.varAvg);
    
    adaptedResults[caseName] = {
      avg,
      min: avg * 0.9, // Approximate
      max: avg * 1.1, // Approximate
      median: avg,
      p95: avg * 1.05,
      avgMemory: 0.1, // Default since we don't track memory in direct benchmarks
      maxMemory: 0.15,
      codeSize: stats.codeSize,
      iterations: stats.iterations
    };
  });
  
  return adaptedResults;
}

module.exports = {
  compareVersions,
  generateComparisonReport,
  regressionCheck
};

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'compare';
  
  if (command === 'compare') {
    const options = {
      commitCount: args.includes('--commits') ? parseInt(args[args.indexOf('--commits') + 1]) || 2 : 2,
      verbose: args.includes('--verbose'),
      outputFile: args.includes('--output') ? args[args.indexOf('--output') + 1] : null
    };
    
    compareVersions(options).catch(console.error);
    
  } else if (command === 'regression') {
    const threshold = args.includes('--threshold') ? parseInt(args[args.indexOf('--threshold') + 1]) || 20 : 20;
    regressionCheck(threshold).catch(console.error);
    
  } else {
    console.log('Usage:');
    console.log('  node compare.js compare [--commits N] [--verbose] [--output file.json]');
    console.log('  node compare.js regression [--threshold N]');
  }
}
