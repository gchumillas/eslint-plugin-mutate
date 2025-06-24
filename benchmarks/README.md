# Benchmarks Directory

This directory contains performance benchmarking tools for the ESLint Plugin Mutate.

## Files Overview

### Core Benchmark Files

- **`benchmark.js`** - Main benchmark runner with comprehensive test cases
- **`compare.js`** - Git commit comparison tool for performance tracking
- **`rule-performance.js`** - Focused benchmarks for individual rules
- **`ci-check.sh`** - Automated CI/CD performance validation script

### Results Directory

- **`results/`** - Generated benchmark reports and logs (auto-created, git-ignored)

**Note**: The `results/` directory is automatically created when running benchmarks and is excluded from version control via `.gitignore`. Results are intended for local analysis and CI artifacts.

## Quick Start

```bash
# Run basic benchmarks
npm run benchmark

# Compare with previous commits
npm run benchmark:compare

# Run rule-specific performance tests
npm run benchmark:rules

# Full CI performance check
npm run benchmark:ci
```

## Benchmark Types

### 1. Comprehensive Benchmarks (`benchmark.js`)

Tests the plugin with various code complexity levels:

- **Tiny**: Simple single mutation
- **Small**: Basic function with few mutations  
- **Medium**: Multiple parameters and mutation types
- **Large**: Generated code with 500+ mutations
- **Nested**: Deep function nesting (8 levels)
- **Complex**: Real-world-like data processing scenarios
- **TypeScript**: Type annotation specific tests

**Metrics measured:**
- Average execution time
- Median, min, max response times
- 95th percentile performance
- Memory usage (average and peak)

### 2. Git Comparison (`compare.js`)

Compares performance across git commits:

```bash
# Compare current vs last 2 commits
node benchmarks/compare.js compare --commits 2

# Generate detailed JSON report
node benchmarks/compare.js compare --output results/comparison.json

# Quick regression check (20% threshold)
node benchmarks/compare.js regression --threshold 20
```

### 3. Rule-Specific Testing (`rule-performance.js`)

Isolated performance testing for individual rules:

- Tests `require-mut-param` and `require-mut-var` separately
- Direct rule execution simulation (bypasses ESLint overhead)
- Memory profiling capabilities
- Rule-to-rule performance comparison

### 4. CI Integration (`ci-check.sh`)

Automated performance validation for CI/CD:

- Runs all benchmark types
- Checks for performance regressions
- Generates CI-friendly reports
- Configurable failure thresholds
- Saves artifacts for performance tracking

## Usage Examples

### Basic Benchmarking

```bash
# Standard benchmark run
npm run benchmark

# Verbose output with code previews
npm run benchmark -- --verbose

# Test only the parameter rule
npm run benchmark -- --param-only
```

### Performance Regression Detection

```bash
# Check for regressions vs previous commit
npm run benchmark:regression

# Custom threshold (fail if 30% slower)
npm run benchmark:regression -- --threshold 30
```

### Memory Profiling

```bash
# Include memory usage analysis
npm run benchmark:rules -- --memory

# Force garbage collection (requires node --expose-gc)
node --expose-gc benchmarks/rule-performance.js --memory
```

### Continuous Integration

```bash
# Full CI performance check
./benchmarks/ci-check.sh

# Custom threshold for CI
THRESHOLD_PERCENT=15 ./benchmarks/ci-check.sh
```

## Understanding Results

### Performance Metrics

- **Average Time**: Mean execution time across all iterations
- **Median Time**: Middle value (less affected by outliers)
- **95th Percentile**: Performance guarantee for 95% of executions
- **Memory Usage**: Heap allocation during rule execution

### Interpreting Output

```bash
📈 Testing MEDIUM case:
   Code size: 487 characters
   Iterations: 100
   ⏱️  Average: 1.23ms
   📊 Median:  1.15ms
   ⚡ Min:     0.98ms
   🔥 Max:     2.34ms
   📈 95th %:  1.89ms
   💾 Memory:  0.15MB avg, 0.28MB peak
```

**What this means:**
- Most executions complete in ~1.15ms
- 95% complete within 1.89ms
- Memory usage is reasonable (~0.15MB)
- No concerning outliers (max only 2x median)

### Performance Benchmarks

For the current plugin implementation, typical performance expectations:

- **Simple mutations**: < 0.5ms per file
- **Complex scenarios**: < 2.0ms per file  
- **Large files (500+ mutations)**: < 10ms per file
- **Memory usage**: < 1MB per file

### Red Flags

Watch out for:
- ⚠️ **Execution time > 5ms** for medium complexity
- ⚠️ **Memory usage > 5MB** per file
- ⚠️ **Performance regression > 25%** between commits
- ⚠️ **High variance** (max >> median) indicating inconsistent performance

## Configuration

### Benchmark Settings

Modify iterations in `benchmark.js`:

```javascript
const iterations = {
  tiny: 1000,    // Fast, simple cases
  small: 500,    // Basic functionality  
  medium: 100,   // Realistic complexity
  large: 50,     // Heavy computation
  nested: 100,   // Deep nesting
  complex: 20,   // Real-world scenarios
  typescript: 100 // Type checking
};
```

### CI Thresholds

Adjust regression sensitivity in `ci-check.sh`:

```bash
THRESHOLD_PERCENT=25  # Fail if 25% slower
```

## Integration with Development Workflow

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "🔍 Running performance regression check..."
npm run benchmark:regression
```

### GitHub Actions

```yaml
name: Performance Check
on: [pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2  # Need previous commit
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run performance benchmarks
        run: ./benchmarks/ci-check.sh
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: benchmarks/results/
```

## Troubleshooting

### Common Issues

1. **"Parse error" in rule tests**
   - Check if code samples have valid syntax
   - Ensure TypeScript parser is available for .ts files

2. **High memory usage**
   - Run with `node --expose-gc` to enable garbage collection
   - Check for memory leaks in rule implementations

3. **Inconsistent timing**
   - Run more iterations for better statistical accuracy
   - Avoid running other intensive processes during benchmarks

4. **Git comparison failures**
   - Ensure clean git state (commit changes first)
   - Check that previous commits exist

### Performance Optimization Tips

1. **Rule Implementation**
   - Minimize AST traversal depth
   - Cache computation results when possible
   - Use efficient data structures (Map vs Object)

2. **Benchmarking**
   - Include warmup runs to avoid JIT compilation effects
   - Use appropriate iteration counts for statistical significance
   - Profile memory usage to detect leaks

## Contributing

When adding new benchmark tests:

1. Add test cases to appropriate files
2. Update iteration counts based on complexity
3. Document expected performance characteristics
4. Test CI integration before merging

For performance improvements:

1. Run benchmarks before and after changes
2. Document performance impact in PR description
3. Ensure no regressions in edge cases
4. Update benchmark expectations if needed
