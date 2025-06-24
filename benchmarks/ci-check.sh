#!/bin/bash

# ESLint Plugin Mutate - CI Performance Check
# This script runs benchmarks and checks for performance regressions

set -e

echo "🚀 Starting performance benchmarks for CI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
THRESHOLD_PERCENT=25  # Fail if performance degrades by more than 25%
OUTPUT_DIR="benchmarks/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p $OUTPUT_DIR

echo "📊 Running baseline benchmark..."

# Run main benchmark
node benchmarks/benchmark.js > "$OUTPUT_DIR/benchmark_$TIMESTAMP.log" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Baseline benchmark completed successfully${NC}"
else
    echo -e "${RED}❌ Baseline benchmark failed${NC}"
    cat "$OUTPUT_DIR/benchmark_$TIMESTAMP.log"
    exit 1
fi

echo "🎯 Running rule-specific performance tests..."

# Run rule-specific benchmarks
node benchmarks/rule-performance.js > "$OUTPUT_DIR/rule-perf_$TIMESTAMP.log" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Rule performance tests completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Rule performance tests had issues${NC}"
    cat "$OUTPUT_DIR/rule-perf_$TIMESTAMP.log"
fi

echo "🔍 Checking for performance regressions..."

# Run regression check if we have previous commits
if git rev-parse HEAD~1 >/dev/null 2>&1; then
    node benchmarks/compare.js regression --threshold $THRESHOLD_PERCENT > "$OUTPUT_DIR/regression_$TIMESTAMP.log" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ No significant performance regressions detected${NC}"
    else
        echo -e "${RED}❌ Performance regression detected!${NC}"
        cat "$OUTPUT_DIR/regression_$TIMESTAMP.log"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No previous commit found, skipping regression check${NC}"
fi

echo "💾 Saving performance report..."

# Generate JSON report for CI artifacts
cat > "$OUTPUT_DIR/ci-report_$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse HEAD)",
  "branch": "$(git branch --show-current)",
  "threshold": $THRESHOLD_PERCENT,
  "status": "success",
  "files": {
    "benchmark": "benchmark_$TIMESTAMP.log",
    "rulePerformance": "rule-perf_$TIMESTAMP.log",
    "regression": "regression_$TIMESTAMP.log"
  }
}
EOF

echo -e "${GREEN}🎉 All performance checks passed!${NC}"
echo "📁 Results saved in: $OUTPUT_DIR/"
echo "📊 Report: $OUTPUT_DIR/ci-report_$TIMESTAMP.json"

# Optional: Upload results to a performance tracking service
if [ ! -z "$PERF_TRACKING_URL" ]; then
    echo "📤 Uploading results to performance tracker..."
    curl -X POST "$PERF_TRACKING_URL" \
         -H "Content-Type: application/json" \
         -d @"$OUTPUT_DIR/ci-report_$TIMESTAMP.json" || echo "Upload failed, continuing..."
fi
