// Test TypeScript variable type detection

const changeUserName = (user: Mut<{name: string}>) => {
  user.name = 'Johnny';
}

// ✅ Should pass - variable with Mut<T> type
const user: Mut<{name: string}> = {
  name: 'John Smith'
}

changeUserName(user);

// ❌ Should error - variable without Mut<T> type or mut prefix
const regularUser: {name: string} = {
  name: 'Jane'
}

changeUserName(regularUser);

export {};
