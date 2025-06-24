#!/bin/bash

# Local CI Testing Script for eslint-plugin-mutate
# This script mimics the GitHub Actions CI workflow locally
# Fixed version with proper nvm initialization and fallback options

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

# Initialize nvm if available
NVM_AVAILABLE=false
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    NVM_AVAILABLE=true
    echo -e "${BLUE}✅ nvm initialized from ~/.nvm/nvm.sh${NC}"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
    source "/opt/homebrew/opt/nvm/nvm.sh"
    NVM_AVAILABLE=true
    echo -e "${BLUE}✅ nvm initialized (Homebrew)${NC}"
elif command -v nvm >/dev/null 2>&1; then
    NVM_AVAILABLE=true
    echo -e "${BLUE}✅ nvm already available${NC}"
fi

# Detect available node version managers
detect_node_manager() {
    if [ "$NVM_AVAILABLE" = true ] && command -v nvm >/dev/null 2>&1; then
        echo "nvm"
    elif command -v fnm >/dev/null 2>&1; then
        echo "fnm"
    elif command -v n >/dev/null 2>&1; then
        echo "n"
    elif command -v volta >/dev/null 2>&1; then
        echo "volta"
    else
        echo "none"
    fi
}

NODE_MANAGER=$(detect_node_manager)
echo -e "${BLUE}Node version manager detected: ${NODE_MANAGER}${NC}"

# Function to switch Node version based on available manager
switch_node_version() {
    local version=$1
    local success=false
    
    case $NODE_MANAGER in
        "nvm")
            echo -e "${BLUE}Using nvm to switch to Node ${version}${NC}"
            if nvm use ${version} 2>/dev/null; then
                success=true
            elif nvm install ${version} 2>/dev/null && nvm use ${version} 2>/dev/null; then
                success=true
            else
                echo -e "${YELLOW}⚠️  Failed to install/use Node ${version} with nvm${NC}"
            fi
            ;;
        "fnm")
            echo -e "${BLUE}Using fnm to switch to Node ${version}${NC}"
            if fnm use ${version} 2>/dev/null; then
                success=true
            elif fnm install ${version} 2>/dev/null && fnm use ${version} 2>/dev/null; then
                success=true
            fi
            ;;
        "n")
            echo -e "${BLUE}Using n to switch to Node ${version}${NC}"
            if n ${version} 2>/dev/null; then
                success=true
            fi
            ;;
        "volta")
            echo -e "${BLUE}Using volta to switch to Node ${version}${NC}"
            if volta install node@${version} 2>/dev/null && volta pin node@${version} 2>/dev/null; then
                success=true
            fi
            ;;
        "none")
            echo -e "${YELLOW}⚠️  No Node version manager found${NC}"
            local current_version=$(node --version 2>/dev/null | sed 's/v//' || echo "none")
            if [ "$current_version" = "$version" ]; then
                echo -e "${GREEN}✅ Current Node version matches target ($version)${NC}"
                success=true
            elif [ "$current_version" = "none" ]; then
                echo -e "${RED}❌ No Node.js installation found${NC}"
                success=false
            else
                echo -e "${YELLOW}⚠️  Current Node version ($current_version) doesn't match target ($version)${NC}"
                echo -e "${YELLOW}   Continuing with current version...${NC}"
                success=true  # Continue with current version
            fi
            ;;
    esac
    
    if [ "$success" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to run tests for a specific Node version
test_node_version() {
    local version=$1
    echo ""
    echo -e "${YELLOW}🧪 Testing with Node.js ${version}${NC}"
    echo "----------------------------------------"
    
    # Switch to the specific Node version (or continue with current for "none")
    if ! switch_node_version ${version}; then
        if [ "$NODE_MANAGER" = "none" ]; then
            echo -e "${YELLOW}⚠️  Continuing with current Node version${NC}"
        else
            echo -e "${RED}❌ Failed to switch to Node ${version}${NC}"
            return 1
        fi
    fi
    
    # Verify Node version
    local actual_version=$(node --version 2>/dev/null || echo "unknown")
    local npm_version=$(npm --version 2>/dev/null || echo "unknown")
    echo -e "${BLUE}Using Node: ${actual_version}${NC}"
    echo -e "${BLUE}Using npm: ${npm_version}${NC}"
    
    if [ "$actual_version" = "unknown" ]; then
        echo -e "${RED}❌ Node.js not available${NC}"
        return 1
    fi
    
    # Clean install
    echo -e "${YELLOW}🧹 Cleaning and installing dependencies...${NC}"
    rm -rf node_modules package-lock.json 2>/dev/null || true
    if ! npm install; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        return 1
    fi
    
    # Run tests
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    if ! npm test; then
        echo -e "${RED}❌ Tests failed for Node ${version}${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Tests passed for Node ${version}${NC}"
    
    # Test plugin integration
    echo -e "${YELLOW}🔌 Testing plugin integration...${NC}"
    
    # Create temporary test directory
    local TEST_DIR="test-project-temp-${version}"
    rm -rf ${TEST_DIR} 2>/dev/null || true
    mkdir ${TEST_DIR}
    
    # Package the plugin
    if ! npm pack; then
        echo -e "${RED}❌ Failed to package plugin${NC}"
        rm -rf ${TEST_DIR}
        return 1
    fi
    
    cd ${TEST_DIR}
    
    # Initialize test project
    npm init -y > /dev/null
    
    # Install our plugin and ESLint
    if ! npm install ../eslint-plugin-mutate-*.tgz; then
        echo -e "${RED}❌ Failed to install plugin${NC}"
        cd ..
        rm -rf ${TEST_DIR}
        return 1
    fi
    
    if ! npm install eslint; then
        echo -e "${RED}❌ Failed to install ESLint${NC}"
        cd ..
        rm -rf ${TEST_DIR}
        return 1
    fi
    
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
        rm -f eslint-plugin-mutate-*.tgz
        return 1
    else
        echo -e "${GREEN}✅ Plugin correctly detected mutation error${NC}"
    fi
    
    cd ..
    rm -rf ${TEST_DIR}
    rm -f eslint-plugin-mutate-*.tgz
    
    echo -e "${GREEN}✅ All checks passed for Node ${version}${NC}"
    return 0
}

# Simplified test function for when no version manager is available
test_node_version_simple() {
    echo ""
    echo -e "${YELLOW}🧪 Running tests with current Node.js version${NC}"
    echo "----------------------------------------"
    
    # Verify Node version
    local actual_version=$(node --version 2>/dev/null || echo "unknown")
    local npm_version=$(npm --version 2>/dev/null || echo "unknown")
    echo -e "${BLUE}Using Node: ${actual_version}${NC}"
    echo -e "${BLUE}Using npm: ${npm_version}${NC}"
    
    if [ "$actual_version" = "unknown" ]; then
        echo -e "${RED}❌ Node.js not available${NC}"
        return 1
    fi
    
    # Clean install
    echo -e "${YELLOW}🧹 Cleaning and installing dependencies...${NC}"
    rm -rf node_modules package-lock.json 2>/dev/null || true
    if ! npm install; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        return 1
    fi
    
    # Run tests
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    if ! npm test; then
        echo -e "${RED}❌ Tests failed${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Tests passed${NC}"
    
    # Test plugin integration
    echo -e "${YELLOW}🔌 Testing plugin integration...${NC}"
    
    # Create temporary test directory
    local TEST_DIR="test-project-temp-current"
    rm -rf ${TEST_DIR} 2>/dev/null || true
    mkdir ${TEST_DIR}
    
    # Package the plugin
    if ! npm pack; then
        echo -e "${RED}❌ Failed to package plugin${NC}"
        rm -rf ${TEST_DIR}
        return 1
    fi
    
    cd ${TEST_DIR}
    
    # Initialize test project
    npm init -y > /dev/null
    
    # Install our plugin and ESLint
    if ! npm install ../eslint-plugin-mutate-*.tgz; then
        echo -e "${RED}❌ Failed to install plugin${NC}"
        cd ..
        rm -rf ${TEST_DIR}
        return 1
    fi
    
    if ! npm install eslint; then
        echo -e "${RED}❌ Failed to install ESLint${NC}"
        cd ..
        rm -rf ${TEST_DIR}
        return 1
    fi
    
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
        rm -f eslint-plugin-mutate-*.tgz
        return 1
    else
        echo -e "${GREEN}✅ Plugin correctly detected mutation error${NC}"
    fi
    
    cd ..
    rm -rf ${TEST_DIR}
    rm -f eslint-plugin-mutate-*.tgz
    
    echo -e "${GREEN}✅ All checks passed${NC}"
    return 0
}

# Run tests for each Node version
FAILED_VERSIONS=()

if [ "$NODE_MANAGER" = "none" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No Node version manager detected${NC}"
    echo -e "${YELLOW}To install one, choose from:${NC}"
    echo -e "${YELLOW}  • nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash${NC}"
    echo -e "${YELLOW}  • fnm: curl -fsSL https://fnm.vercel.app/install | bash${NC}"
    echo -e "${YELLOW}  • n: npm install -g n${NC}"
    echo ""
    echo -e "${BLUE}Testing with current Node version only...${NC}"
    
    # Test with current Node version only
    current_version=$(node --version 2>/dev/null | sed 's/v//' || echo "unknown")
    if [ "$current_version" != "unknown" ]; then
        echo -e "${BLUE}Current Node version: v${current_version}${NC}"
        if test_node_version_simple; then
            echo -e "${GREEN}✅ Tests passed with current Node version${NC}"
        else
            echo -e "${RED}❌ Tests failed with current Node version${NC}"
            FAILED_VERSIONS+=("current-${current_version}")
        fi
    else
        echo -e "${RED}❌ No Node.js installation found${NC}"
        echo -e "${RED}Please install Node.js: https://nodejs.org/${NC}"
        exit 1
    fi
else
    for version in "${NODE_VERSIONS[@]}"; do
        if test_node_version ${version}; then
            echo -e "${GREEN}✅ Node ${version} - SUCCESS${NC}"
        else
            echo -e "${RED}❌ Node ${version} - FAILED${NC}"
            FAILED_VERSIONS+=($version)
        fi
    done
fi

echo ""
echo "=================================================================="
echo -e "${BLUE}📊 CI Testing Summary${NC}"
echo "=================================================================="

if [ ${#FAILED_VERSIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit_code=0
else
    echo -e "${RED}❌ Failed versions: ${FAILED_VERSIONS[*]}${NC}"
    exit_code=1
fi

# Restore original Node version if it was set and manager is available
if [ "${CURRENT_NODE}" != "none" ] && [ "$NODE_MANAGER" != "none" ]; then
    echo -e "${BLUE}🔄 Restoring original Node version...${NC}"
    case $NODE_MANAGER in
        "nvm")
            if nvm use ${CURRENT_NODE#v} 2>/dev/null; then
                echo -e "${GREEN}✅ Restored to ${CURRENT_NODE}${NC}"
            elif nvm use default 2>/dev/null; then
                echo -e "${GREEN}✅ Restored to default version${NC}"
            else
                echo -e "${YELLOW}⚠️  Could not restore original version${NC}"
            fi
            ;;
        "fnm")
            if fnm use ${CURRENT_NODE#v} 2>/dev/null; then
                echo -e "${GREEN}✅ Restored to ${CURRENT_NODE}${NC}"
            else
                echo -e "${YELLOW}⚠️  Could not restore original version${NC}"
            fi
            ;;
        "n")
            if n ${CURRENT_NODE#v} 2>/dev/null; then
                echo -e "${GREEN}✅ Restored to ${CURRENT_NODE}${NC}"
            else
                echo -e "${YELLOW}⚠️  Could not restore original version${NC}"
            fi
            ;;
        "volta")
            # Volta pins are project-specific, no need to restore
            echo -e "${BLUE}Volta version management is project-specific${NC}"
            ;;
    esac
fi

echo -e "${BLUE}Done!${NC}"
exit $exit_code
