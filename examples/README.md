# Examples

This folder contains example files demonstrating how to use `eslint-plugin-mutate`.

## Files

### `javascript-examples.js`
Examples for JavaScript projects showing:
- ❌ **Invalid**: Parameters that are mutated without `mut` prefix
- ✅ **Valid**: Parameters with proper `mut` prefix for mutations
- ✅ **Valid**: Read-only parameters without mutations

Run with:
```bash
npx eslint examples/javascript-examples.js
```

### `typescript-examples.ts`
Examples for TypeScript projects showing:
- ❌ **Invalid**: Parameters that are mutated without `Mut<T>` type annotation
- ✅ **Valid**: Parameters with `Mut<T>` type annotation for mutations  
- ✅ **Valid**: Read-only parameters with regular types
- ✅ **Valid**: Mixed usage showing both mutable and read-only parameters

Run with:
```bash
npx eslint examples/typescript-examples.ts
```

## Key Differences

**JavaScript**: Requires `mut` prefix for mutable parameters
```javascript
function updateUser(mutUser) {  // ✅ Correct
  mutUser.name = 'Updated';
}
```

**TypeScript**: Uses `Mut<T>` type annotation
```typescript
function updateUser(user: Mut<User>) {  // ✅ Correct
  user.name = 'Updated';
}
```

## Usage with Variables

**JavaScript**: Variables passed to mutating functions need `mut` prefix
```javascript
const mutUserData = { name: 'John' };
updateUser(mutUserData);  // ✅ Correct
```

**TypeScript**: Variables can use `Mut<T>` type instead of prefix
```typescript
const userData: Mut<User> = { name: 'John' };
updateUser(userData);  // ✅ Correct
```
