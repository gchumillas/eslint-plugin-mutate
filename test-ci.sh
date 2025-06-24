#!/bin/bash

# Local CI Testing Script for eslint-plugin-mutate
# This script mimics the GitHub Actions CI workflow locally

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Node versions to test (matching CI matrix)
NODE_VERSIONS=("16.17.0" "18.19.1" "20.11.1")

echo -e "${BLUE}🚀 Starting Local CI Testing for eslint-plugin-mutate${NC}"
echo "=================================================================="

# Store current node version to restore later
CURRENT_NODE=$(node --version 2>/dev/null || echo "none")
echo -e "${BLUE}Current Node version: ${CURRENT_NODE}${NC}"

# Function to run tests for a specific Node version
test_node_version() {
    local version=$1
    echo ""
    echo -e "${YELLOW}� Testing with Node.js ${version}${NC}"
    echo "----------------------------------------"
    
    # Switch to the specific Node version
    if ! nvm use ${version}; then
        echo -e "${RED}❌ Failed to switch to Node ${version}. Installing...${NC}"
        nvm install ${version}
        nvm use ${version}
    fi
    
    # Verify Node version
    local actual_version=$(node --version)
    echo -e "${BLUE}Using Node: ${actual_version}${NC}"
    echo -e "${BLUE}Using npm: $(npm --version)${NC}"
    
    # Clean install
    echo -e "${YELLOW}🧹 Cleaning and installing dependencies...${NC}"
    rm -rf node_modules package-lock.json
    npm install
    
    # Run tests
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    if npm test; then
        echo -e "${GREEN}✅ Tests passed for Node ${version}${NC}"
    else
        echo -e "${RED}❌ Tests failed for Node ${version}${NC}"
        return 1
    fi
    
    # Test plugin integration
    echo -e "${YELLOW}🔌 Testing plugin integration...${NC}"
    
    # Create temporary test directory
    TEST_DIR="test-project-temp-${version}"
    rm -rf ${TEST_DIR}
    mkdir ${TEST_DIR}
    
    # Package the plugin
    npm pack
    
    cd ${TEST_DIR}
    
    # Initialize test project
    npm init -y > /dev/null
    
    # Install our plugin and ESLint
    npm install ../eslint-plugin-mutate-*.tgz
    npm install eslint
    
    # Create ESLint config
    cat > .eslintrc.js << 'EOF'
module.exports = {
    plugins: ['mutate'],
    rules: {
        'mutate/require-mut-param': 'error'
    },
    env: {
        node: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2018
    }
};
EOF
    
    # Create test file with mutation
    echo "function test(user) { user.name = 'test'; }" > test.js
    
    # Run ESLint - should fail (detect mutation error)
    if npx eslint test.js 2>/dev/null; then
        echo -e "${RED}❌ Plugin integration failed - mutation not detected${NC}"
        cd ..
        rm -rf ${TEST_DIR}
        return 1
    else
        echo -e "${GREEN}✅ Plugin correctly detected mutation error${NC}"
    fi
    
    cd ..
    rm -rf ${TEST_DIR}
    rm -f eslint-plugin-mutate-*.tgz
    
    echo -e "${GREEN}✅ All checks passed for Node ${version}${NC}"
}

# Run tests for each Node version
FAILED_VERSIONS=()

for version in "${NODE_VERSIONS[@]}"; do
    if test_node_version ${version}; then
        echo -e "${GREEN}✅ Node ${version} - SUCCESS${NC}"
    else
        echo -e "${RED}❌ Node ${version} - FAILED${NC}"
        FAILED_VERSIONS+=($version)
    fi
done

echo ""
echo "=================================================================="
echo -e "${BLUE}📊 CI Testing Summary${NC}"
echo "=================================================================="

if [ ${#FAILED_VERSIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All Node versions passed!${NC}"
    exit_code=0
else
    echo -e "${RED}❌ Failed versions: ${FAILED_VERSIONS[*]}${NC}"
    exit_code=1
fi

# Restore original Node version if it was set
if [ "${CURRENT_NODE}" != "none" ]; then
    echo -e "${BLUE}� Restoring original Node version...${NC}"
    nvm use ${CURRENT_NODE#v} 2>/dev/null || nvm use default
fi

echo -e "${BLUE}Done!${NC}"
exit $exit_code
