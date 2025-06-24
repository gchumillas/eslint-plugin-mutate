const { ESLint } = require('eslint');
const path = require('path');

// Simple test to verify the benchmark system works
async function testBenchmarkSetup() {
  console.log('🧪 Testing benchmark setup...\n');
  
  // Simple test case
  const testCode = `
    function updateUser(user) {
      user.name = 'test';
      user.email = 'test@example.com';
    }
  `;
  
  try {
    // Create ESLint instance with absolute path to plugin
    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: {
        plugins: ['mutate'],
        rules: {
          'mutate/require-mut-param': 'error'
        },
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module'
        }
      },
      resolvePluginsRelativeTo: path.resolve(__dirname, '..')
    });
    
    console.log('✅ ESLint instance created successfully');
    
    // Test linting
    const results = await eslint.lintText(testCode, { filePath: 'test.js' });
    console.log(`✅ Linting completed - found ${results[0].messages.length} issues`);
    
    if (results[0].messages.length > 0) {
      console.log('📋 Issues found:');
      results[0].messages.forEach((message, index) => {
        console.log(`   ${index + 1}. ${message.message}`);
      });
    }
    
    console.log('\n🎉 Benchmark setup is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Benchmark setup failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testBenchmarkSetup();
}

module.exports = { testBenchmarkSetup };
