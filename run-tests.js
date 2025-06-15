#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Ejecutando tests para eslint-plugin-mutate...\n');

// Ejecutar todos los tests
const testProcess = spawn('npx', ['mocha', 'tests/**/*.test.js', '--reporter', 'spec'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ ¡Todos los tests pasaron exitosamente!');
    console.log('\n📋 Resumen de cobertura:');
    console.log('   - Tests unitarios de la regla principal');
    console.log('   - Tests de integración del plugin');
    console.log('   - Tests de casos extremos y edge cases');
    console.log('\n🎉 El plugin está listo para usar!');
  } else {
    console.log(`\n❌ Los tests fallaron con código: ${code}`);
    process.exit(code);
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Error ejecutando tests:', error.message);
  console.log('\n💡 Asegúrate de haber instalado las dependencias:');
  console.log('   npm install');
  process.exit(1);
});