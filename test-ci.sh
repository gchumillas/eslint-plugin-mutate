#!/bin/bash

echo "🧪 Testing CI locally..."
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi

# Step 2: Run tests
echo ""
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# Step 3: Lint code
echo ""
echo "🔍 Linting code..."
npx eslint . --ext .js
if [ $? -ne 0 ]; then
  echo "⚠️  Linting found issues (this will fail CI)"
  echo "Fix linting errors or continue anyway? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 4: Test plugin integration
echo ""
echo "🔌 Testing plugin integration..."
npm pack > /dev/null

# Create temp directory
mkdir -p test-project-temp
cd test-project-temp

npm init -y > /dev/null
npm install ../eslint-plugin-mutate-*.tgz > /dev/null
npm install eslint > /dev/null

echo "module.exports = { plugins: ['mutate'], rules: { 'mutate/require-mut-param': 'error' } };" > .eslintrc.js
echo "function test(user) { user.name = 'test'; }" > test.js

# Test that plugin correctly detects error
npx eslint test.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "❌ Plugin should have detected mutation error but didn't"
  cd ..
  rm -rf test-project-temp
  exit 1
else
  echo "✅ Plugin correctly detected mutation error"
fi

cd ..
rm -rf test-project-temp
rm eslint-plugin-mutate-*.tgz

echo ""
echo "🎉 All CI checks passed locally!"
echo "Ready to push to GitHub! 🚀"
