#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running tests for eslint-plugin-mutate...\n');

// Run all tests
const testProcess = spawn('npx', ['mocha', 'tests/**/*.test.js', '--reporter', 'spec'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed successfully!');
    console.log('\n📋 Coverage summary:');
    console.log('   - Unit tests for main rule');
    console.log('   - Plugin integration tests');
    console.log('   - Edge cases and complex scenarios');
    console.log('\n🎉 The plugin is ready to use!');
  } else {
    console.log(`\n❌ Tests failed with code: ${code}`);
    process.exit(code);
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Error running tests:', error.message);
  console.log('\n💡 Make sure you have installed dependencies:');
  console.log('   npm install');
  process.exit(1);
});