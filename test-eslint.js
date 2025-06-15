// Script para probar el plugin ESLint directamente
const { Linter } = require('eslint');
const plugin = require('./index.js');
const fs = require('fs');

function testPlugin() {
  const linter = new Linter();
  
  // Registrar el plugin
  linter.defineRule('mutate/require-mut-prefix', plugin.rules['require-mut-prefix']);
  
  // Leer el archivo de prueba
  const code = fs.readFileSync('./test-examples.js', 'utf8');
  
  // Configuración de ESLint
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
    
    console.log('=== RESULTADOS DE ESLint ===');
    console.log(`Archivo: test-examples.js`);
    console.log(`Errores encontrados: ${results.messages.length}`);
    console.log(`Código fue modificado: ${results.fixed}`);
    
    if (results.messages.length > 0) {
      console.log('\n--- ERRORES DETECTADOS ---');
      results.messages.forEach((message, index) => {
        console.log(`${index + 1}. Línea ${message.line}:${message.column}`);
        console.log(`   ${message.severity === 2 ? 'ERROR' : 'WARNING'}: ${message.message}`);
        console.log(`   Regla: ${message.ruleId}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No se encontraron problemas');
    }
    
    // Mostrar algunas líneas específicas para verificar
    const lines = code.split('\n');
    console.log('\n--- ANÁLISIS DE LÍNEAS ESPECÍFICAS ---');
    console.log('Línea 3:', lines[2]);  // user.registered = true;
    console.log('Línea 7:', lines[6]);  // list.push(item);
    console.log('Línea 11:', lines[10]); // counter.value++;
    
  } catch (error) {
    console.error('Error al ejecutar ESLint:', error);
  }
}

testPlugin();
