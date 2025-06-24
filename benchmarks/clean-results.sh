#!/bin/bash

# Clean benchmark results script
# This script removes all generated benchmark files

echo "🧹 Cleaning benchmark results..."

RESULTS_DIR="benchmarks/results"

if [ -d "$RESULTS_DIR" ]; then
    echo "📁 Found results directory: $RESULTS_DIR"
    
    # Count files before deletion
    FILE_COUNT=$(find "$RESULTS_DIR" -type f | wc -l)
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo "🗑️  Removing $FILE_COUNT benchmark result files..."
        rm -rf "$RESULTS_DIR"/*
        echo "✅ Benchmark results cleaned successfully"
    else
        echo "✨ Results directory is already clean"
    fi
else
    echo "📂 No results directory found - nothing to clean"
fi

echo "🎉 Cleanup complete!"
