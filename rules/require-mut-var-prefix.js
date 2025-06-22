module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require "mut" prefix for variables passed to functions that mutate their parameters (JavaScript) or Mut<T> type annotation (TypeScript)',
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
    // Store functions that have mutating parameters (for cross-function analysis)
    const functionsWithMutatingParams = new Map();
    // Store all function calls to check later
    const functionCalls = [];
    // Store all function declarations/expressions for later analysis
    const allFunctions = [];
    // Store information about parameters and their mutations per function
    const functionScopes = new Map();
    // Store variables that have Mut<T> type annotation (for TypeScript)
    const mutTypeVariables = new Set();
    
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
    
    function hasMutType(variable) {
      // For variables, we need to find the variable declaration and check its type annotation
      // This is more complex because we need to look up the variable declaration
      return false; // TODO: Implement this properly
    }
    
    function getVariableDeclaration(variableName, scope) {
      // Find the variable declaration for a given variable name
      let currentScope = scope;
      while (currentScope) {
        const variable = currentScope.variables.find(v => v.name === variableName);
        if (variable && variable.defs.length > 0) {
          return variable.defs[0].node;
        }
        currentScope = currentScope.upper;
      }
      return null;
    }
    
    function hasValidMutableMarker(argument, scope) {
      if (isTypeScript) {
        // In TypeScript, check if the variable has Mut<T> type annotation or mut prefix
        return mutTypeVariables.has(argument.name) || hasMutPrefix(argument.name);
      } else {
        // In JavaScript, require mut prefix
        return hasMutPrefix(argument.name);
      }
    }
    
    function hasMutTypeAnnotation(node) {
      // Check if a variable declaration has Mut<T> type annotation
      if (!node.id || !node.id.typeAnnotation) return false;
      
      const typeAnnotation = node.id.typeAnnotation.typeAnnotation;
      
      // Check for TypeReference with type name 'Mut'
      if (typeAnnotation.type === 'TSTypeReference' && 
          typeAnnotation.typeName && 
          typeAnnotation.typeName.type === 'Identifier' &&
          typeAnnotation.typeName.name === 'Mut') {
        return true;
      }
      
      return false;
    }
    
    function getErrorMessage(variableName) {
      if (isTypeScript) {
        return `Argument '${variableName}' is passed to function which mutates this parameter. Consider using 'Mut<T>' type annotation or renaming to 'mut${variableName.charAt(0).toUpperCase()}${variableName.slice(1)}'.`;
      } else {
        return `Argument '${variableName}' is passed to function which mutates this parameter. Consider renaming to 'mut${variableName.charAt(0).toUpperCase()}${variableName.slice(1)}'.`;
      }
    }
    
    function checkCrossFunctionMutation(node) {
      // Store function calls for later analysis
      if (node.type === 'CallExpression') {
        let functionName = null;
        
        // Handle different types of function calls
        if (node.callee.type === 'Identifier') {
          functionName = node.callee.name;
        } else if (node.callee.type === 'MemberExpression' && 
                   node.callee.property.type === 'Identifier') {
          functionName = node.callee.property.name;
        }
        
        if (functionName) {
          functionCalls.push({
            node,
            functionName,
            arguments: node.arguments
          });
        }
      }
    }
    
    return {
      // Detect variable declarations with Mut<T> type annotation
      'VariableDeclarator'(node) {
        if (isTypeScript && hasMutTypeAnnotation(node)) {
          // Add variable to set of variables with Mut<T> type
          if (node.id.type === 'Identifier') {
            mutTypeVariables.add(node.id.name);
          }
        }
      },

      // Detect when entering a function
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        const params = new Map();
        const mutatedParams = new Set();
        
        // Collect parameters
        node.params.forEach((param, index) => {
          if (param.type === 'Identifier') {
            params.set(param.name, {
              node: param,
              hasMutPrefix: hasMutPrefix(param.name)
            });
          }
        });
        
        functionScopes.set(node, { params, mutatedParams });
        
        // Store function for later analysis
        allFunctions.push(node);
      },
      
      // Detect mutations and function calls
      'AssignmentExpression, UpdateExpression, CallExpression'(node) {
        // Store function calls for later analysis
        checkCrossFunctionMutation(node);
        
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
      
      // When exiting a function, update cross-function analysis data
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression:exit'(node) {
        const scope = functionScopes.get(node);
        if (!scope) return;
        
        // Update cross-function analysis data with actual mutations
        if (scope.mutatedParams.size > 0) {
          let functionName = null;
          
          if (node.type === 'FunctionDeclaration' && node.id) {
            functionName = node.id.name;
          } else if (node.type === 'FunctionExpression' && node.id) {
            functionName = node.id.name;
          } else if (node.type === 'ArrowFunctionExpression') {
            // For arrow functions, check if they are assigned to a variable
            let parent = node.parent;
            
            if (parent && parent.type === 'VariableDeclarator' && 
                parent.id && parent.id.type === 'Identifier') {
              functionName = parent.id.name;
            }
          }
          
          if (functionName) {
            const mutatingParamIndices = [];
            node.params.forEach((param, index) => {
              if (param.type === 'Identifier' && scope.mutatedParams.has(param.name)) {
                mutatingParamIndices.push(index);
              }
            });
            
            if (mutatingParamIndices.length > 0) {
              functionsWithMutatingParams.set(functionName, mutatingParamIndices);
            }
          }
        }
        
        // Clean up the scope
        functionScopes.delete(node);
      },
      
      // Analyze cross-function mutations at the end of the program
      'Program:exit'() {
        const sourceCode = context.getSourceCode();
        
        // Now check all function calls
        for (const call of functionCalls) {
          if (functionsWithMutatingParams.has(call.functionName)) {
            const mutParamIndices = functionsWithMutatingParams.get(call.functionName);
            
            // Check each argument at positions where the function expects mut parameters
            mutParamIndices.forEach(paramIndex => {
              if (paramIndex < call.arguments.length) {
                const argument = call.arguments[paramIndex];
                
                // Check if argument is a simple identifier
                if (argument.type === 'Identifier') {
                  const scope = sourceCode.getScope ? sourceCode.getScope(argument) : context.getScope();
                  if (!hasValidMutableMarker(argument, scope)) {
                    context.report({
                      node: argument,
                      message: getErrorMessage(argument.name)
                    });
                  }
                }
              }
            });
          }
        }
      }
    };
  }
};
