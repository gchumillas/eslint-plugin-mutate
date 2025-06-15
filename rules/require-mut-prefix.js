module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require "mut" prefix for parameters that are mutated within functions',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },

  create(context) {
    // Almacena información sobre parámetros y sus mutaciones por función
    const functionScopes = new Map();
    
    function isMutatingOperation(node) {
      return node.type === 'AssignmentExpression' ||
             node.type === 'UpdateExpression' ||
             (node.type === 'CallExpression' && 
              node.callee.type === 'MemberExpression' &&
              ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill'].includes(node.callee.property.name));
    }
    
    function getRootObjectName(memberExpression) {
      let current = memberExpression;
      while (current.object && current.object.type === 'MemberExpression') {
        current = current.object;
      }
      return current.object && current.object.type === 'Identifier' ? current.object.name : null;
    }
    
    function isParameterMutation(node, paramNames) {
      if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
        const objectName = getRootObjectName(node.left) || node.left.object.name;
        return paramNames.has(objectName);
      }
      
      if (node.type === 'UpdateExpression' && node.argument.type === 'MemberExpression') {
        const objectName = getRootObjectName(node.argument) || node.argument.object.name;
        return paramNames.has(objectName);
      }
      
      if (node.type === 'CallExpression' && 
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier') {
        const objectName = node.callee.object.name;
        const methodName = node.callee.property.name;
        if (paramNames.has(objectName) && 
            ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill'].includes(methodName)) {
          return true;
        }
      }
      
      return false;
    }
    
    function hasMutPrefix(paramName) {
      return paramName.startsWith('mut') && paramName.length > 3 && 
             /^mut[A-Z]/.test(paramName);
    }
    
    return {
      // Detectar cuando entramos en una función
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const params = new Map();
        const mutatedParams = new Set();
        
        // Recopilar parámetros
        node.params.forEach(param => {
          if (param.type === 'Identifier') {
            params.set(param.name, {
              node: param,
              hasMutPrefix: hasMutPrefix(param.name)
            });
          }
        });
        
        functionScopes.set(node, { params, mutatedParams });
      },
      
      // Detectar mutaciones
      'AssignmentExpression, UpdateExpression, CallExpression'(node) {
        // Encontrar todas las funciones contenedoras (para manejar funciones anidadas)
        const containingFunctions = [];
        let parent = node.parent;
        
        while (parent) {
          if (parent.type === 'FunctionDeclaration' || 
              parent.type === 'FunctionExpression' || 
              parent.type === 'ArrowFunctionExpression') {
            containingFunctions.push(parent);
          }
          parent = parent.parent;
        }
        
        if (containingFunctions.length === 0) {
          return;
        }
        
        // Verificar la mutación en todas las funciones contenedoras
        for (const currentFunction of containingFunctions) {
          if (!functionScopes.has(currentFunction)) {
            continue;
          }
          
          const scope = functionScopes.get(currentFunction);
          const paramNames = new Set(scope.params.keys());
          
          if (isMutatingOperation(node) && isParameterMutation(node, paramNames)) {
            let mutatedParamName = null;
            
            if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
              mutatedParamName = getRootObjectName(node.left) || node.left.object.name;
            } else if (node.type === 'UpdateExpression' && node.argument.type === 'MemberExpression') {
              mutatedParamName = getRootObjectName(node.argument) || node.argument.object.name;
            } else if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
              mutatedParamName = node.callee.object.name;
            }
            
            if (mutatedParamName && scope.params.has(mutatedParamName)) {
              scope.mutatedParams.add(mutatedParamName);
            }
          }
        }
      },
      
      // Al salir de la función, verificar si hay parámetros mutados sin prefijo
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression:exit'(node) {
        const scope = functionScopes.get(node);
        if (!scope) return;
        
        scope.mutatedParams.forEach(paramName => {
          const paramInfo = scope.params.get(paramName);
          if (!paramInfo.hasMutPrefix) {
            context.report({
              node: paramInfo.node,
              message: `Parameter '${paramName}' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mut${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}'.`
            });
          }
        });
        
        // Limpiar el scope
        functionScopes.delete(node);
      }
    };
  }
};