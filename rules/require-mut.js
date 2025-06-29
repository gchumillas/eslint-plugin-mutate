module.exports = function createMutRule(ruleType) {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: ruleType === 'param' 
          ? 'Require "mut" prefix for parameters that are mutated within functions (JavaScript) or Mut<T> type annotation (TypeScript)'
          : 'Require "mut" prefix for variables passed to functions that mutate their parameters (JavaScript) or Mut<T> type annotation (TypeScript)',
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
      
      // Shared state between both rule types
      const functionScopes = new Map();
      const functionsWithMutatingParams = new Map();
      const functionCalls = [];
      const mutTypeVariables = new Set();
      
      // Shared helper functions
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
      
      function isValidMutableParam(param) {
        if (isTypeScript) {
          return hasMutType(param);
        } else {
          return hasMutPrefix(param.name);
        }
      }
      
      function hasValidMutableMarker(argument) {
        if (isTypeScript) {
          // In TypeScript, check if the variable has Mut<T> type annotation or mut prefix
          return mutTypeVariables.has(argument.name) || hasMutPrefix(argument.name);
        } else {
          // In JavaScript, require mut prefix
          return hasMutPrefix(argument.name);
        }
      }
      
      function getErrorMessage(paramName, functionName = null) {
        if (ruleType === 'param') {
          if (isTypeScript) {
            return `Parameter '${paramName}' is mutated but doesn't have 'Mut<T>' type annotation. Consider changing type to 'Mut<YourType>'.`;
          } else {
            return `Parameter '${paramName}' is mutated but doesn't have 'mut' prefix. Consider renaming to 'mut${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}'.`;
          }
        } else {
          if (isTypeScript) {
            return `Argument '${paramName}' is passed to function '${functionName}' which mutates this parameter. Consider using 'Mut<T>' type annotation or renaming to 'mut${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}'.`;
          } else {
            return `Argument '${paramName}' is passed to function '${functionName}' which mutates this parameter. Consider renaming to 'mut${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}'.`;
          }
        }
      }
      
      function checkCrossFunctionMutation(node) {
        // Store function calls for later analysis (only for variable rule)
        if (ruleType === 'var' && node.type === 'CallExpression') {
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

      const visitors = {
        // Detect variable declarations with Mut<T> type annotation (for variable rule)
        'VariableDeclarator'(node) {
          if (ruleType === 'var' && isTypeScript && hasMutTypeAnnotation(node)) {
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
          node.params.forEach((param) => {
            if (param.type === 'Identifier') {
              params.set(param.name, {
                node: param,
                isValidMutable: ruleType === 'param' ? isValidMutableParam(param) : false
              });
            }
          });
          
          functionScopes.set(node, { params, mutatedParams });
        },
        
        // Detect mutations and function calls
        'AssignmentExpression, UpdateExpression, CallExpression'(node) {
          // Store function calls for later analysis (variable rule)
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
        
        // When exiting a function, check for violations and update cross-function analysis
        'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression:exit'(node) {
          const scope = functionScopes.get(node);
          if (!scope) return;
          
          // Parameter rule: check if there are mutated parameters without proper prefix/type
          if (ruleType === 'param') {
            scope.mutatedParams.forEach(paramName => {
              const paramInfo = scope.params.get(paramName);
              if (!paramInfo.isValidMutable) {
                context.report({
                  node: paramInfo.node,
                  message: getErrorMessage(paramName)
                });
              }
            });
          }
          
          // Variable rule: update cross-function analysis data with actual mutations
          if (ruleType === 'var' && scope.mutatedParams.size > 0) {
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
        }
      };

      // Variable rule: add Program:exit for cross-function analysis
      if (ruleType === 'var') {
        visitors['Program:exit'] = function() {
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
                    if (!hasValidMutableMarker(argument)) {
                      context.report({
                        node: argument,
                        message: getErrorMessage(argument.name, call.functionName)
                      });
                    }
                  }
                }
              });
            }
          }
        };
      }

      return visitors;
    }
  };
};
