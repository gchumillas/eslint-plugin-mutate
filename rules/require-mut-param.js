module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require "mut" prefix for parameters that are mutated within functions (JavaScript) or Mut<T> type annotation (TypeScript)',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: []
  },

  create(context) {
    // Detect if we're in a TypeScript file
    const filename = context.getFilename();
    const isTypeScript = filename.endsWith('.ts') || filename.endsWith('.tsx');
    
    // Store information about parameters and their mutations per function
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
    
    function hasMutType(param) {
      // Check if parameter has Mut<T> type annotation
      return param.typeAnnotation && 
             param.typeAnnotation.typeAnnotation &&
             param.typeAnnotation.typeAnnotation.type === 'TSTypeReference' &&
             param.typeAnnotation.typeAnnotation.typeName &&
             param.typeAnnotation.typeAnnotation.typeName.name === 'Mut';
    }
    
    function isValidMutableParam(param) {
      if (isTypeScript) {
        return hasMutType(param);
      } else {
        return hasMutPrefix(param.name);
      }
    }
    
    function getErrorMessage(paramName) {
      if (isTypeScript) {
        return `Parameter '${paramName}' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.`;
      } else {
        return `Parameter '${paramName}' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mut${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}'.`;
      }
    }
    
    return {
      // Detect when entering a function
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const params = new Map();
        const mutatedParams = new Set();
        
        // Collect parameters
        node.params.forEach((param) => {
          if (param.type === 'Identifier') {
            params.set(param.name, {
              node: param,
              isValidMutable: isValidMutableParam(param)
            });
          }
        });
        
        functionScopes.set(node, { params, mutatedParams });
      },
      
      // Detect mutations
      'AssignmentExpression, UpdateExpression, CallExpression'(node) {
        // Find all containing functions (to handle nested functions)
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
        
        // Check mutation in all containing functions
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
      
      // When exiting a function, check if there are mutated parameters without prefix
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression:exit'(node) {
        const scope = functionScopes.get(node);
        if (!scope) return;
        
        scope.mutatedParams.forEach(paramName => {
          const paramInfo = scope.params.get(paramName);
          if (!paramInfo.isValidMutable) {
            context.report({
              node: paramInfo.node,
              message: getErrorMessage(paramName)
            });
          }
        });
        
        // Clean up the scope
        functionScopes.delete(node);
      }
    };
  }
};
