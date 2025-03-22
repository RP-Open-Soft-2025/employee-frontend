export interface Session {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    // ... other user properties
  };
  // ... other session properties
} 