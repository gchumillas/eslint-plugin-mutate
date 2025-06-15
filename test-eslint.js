// Script to test the ESLint plugin directly
const { Linter } = require('eslint');
const plugin = require('./index.js');
const fs = require('fs');

function testPlugin() {
  const linter = new Linter();
  
  // Register the plugin
  linter.defineRule('mutate/require-mut-prefix', plugin.rules['require-mut-prefix']);
  
  // Read the test file
  const code = fs.readFileSync('./test-examples.js', 'utf8');
  
  // ESLint configuration
  const config = {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'script'
    },
    rules: {
      'mutate/require-mut-prefix': 'error'
    }
  };
  
  try {
    const results = linter.verifyAndFix(code, config, 'test-examples.js');
    
    console.log('=== ESLint RESULTS ===');
    console.log(`File: test-examples.js`);
    console.log(`Errors found: ${results.messages.length}`);
    console.log(`Code was modified: ${results.fixed}`);
    
    if (results.messages.length > 0) {
      console.log('\n--- DETECTED ERRORS ---');
      results.messages.forEach((message, index) => {
        console.log(`${index + 1}. Line ${message.line}:${message.column}`);
        console.log(`   ${message.severity === 2 ? 'ERROR' : 'WARNING'}: ${message.message}`);
        console.log(`   Rule: ${message.ruleId}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No problems found');
    }
    
    // Show some specific lines for verification
    const lines = code.split('\n');
    console.log('\n--- SPECIFIC LINE ANALYSIS ---');
    console.log('Line 3:', lines[2]);  // user.registered = true;
    console.log('Line 7:', lines[6]);  // list.push(item);
    console.log('Line 11:', lines[10]); // counter.value++;
    
  } catch (error) {
    console.error('Error running ESLint:', error);
  }
}

testPlugin();
