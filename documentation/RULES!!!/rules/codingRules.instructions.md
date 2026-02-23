# Coding Best Practices & Standards

A comprehensive guide for maintaining high-quality, production-ready code across all projects.

---

## 1. 🎯 Code Organization & Architecture

### Modular Structure
- **Ensure generated code is well-organized and modular**, with clear separation of concerns
- **Write code that is self-contained with minimal dependencies**, facilitating easy integration into larger projects
- **Split code into separate files with meaningful names**; avoid files exceeding 300 lines of code
- Keep related functionality grouped together while maintaining clear boundaries

### Specification-First Approach
- **Define contracts before implementation** — write TypeScript interfaces/types first
- **Force AI and developers to work within defined constraints** rather than "vibe coding"
- **Document data shapes and API contracts** before writing implementation code
- Use dependency injection to decouple components from specific implementations

---

## 2. 📝 Naming Conventions

### CamelCase Standard
- **Use camelCase for all variables, functions, and properties**
  - Variables: `userName`, `isActive`, `totalCount`
  - Functions: `fetchUserData()`, `handleSubmit()`, `calculateTotal()`
  - Private methods: `_internalHelper()` (with underscore prefix)
  
- **Use PascalCase for classes, types, and components**
  - Classes: `UserProfile`, `DataService`
  - React Components: `UserCard`, `NavigationBar`
  - TypeScript Types: `User`, `FetchState<T>`

- **Use UPPER_SNAKE_CASE for constants**
  - `MAX_RETRY_ATTEMPTS`, `API_BASE_URL`, `DEFAULT_TIMEOUT`

### Descriptive Naming
- **Use descriptive variable, function, and class names that reflect their purpose**
- Avoid ambiguous names like `data`, `temp`, `obj` — be specific: `userData`, `temporaryToken`, `configObject`
- Boolean variables should be prefixed with `is`, `has`, `should`: `isLoading`, `hasPermission`, `shouldUpdate`

---

## 3. 🚫 Anti-Pattern: Avoiding "Slop Code"

### What is Slop Code?
Code generated without context, constraints, or real-world considerations — typically produced by "vibe coding" without proper specifications.

### Common Slop Patterns to Avoid

#### ❌ Race Conditions
```javascript
// BAD: No abort handling
useEffect(() => {
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => setUser(data));
}, [userId]);
```

**✅ Solution:** Use `AbortController` to handle rapid state changes
```javascript
useEffect(() => {
  const controller = new AbortController();
  
  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        handleError(error);
      }
    });
  
  return () => controller.abort();
}, [userId]);
```

#### ❌ State Desynchronization
```javascript
// BAD: Duplicate state that gets out of sync
const [user, setUser] = useState(null);
const [name, setName] = useState('');
const [email, setEmail] = useState('');
```

**✅ Solution:** Single source of truth with explicit edit state
```javascript
const [userData, setUserData] = useState<FetchState<User>>({ status: 'idle' });
const [editForm, setEditForm] = useState<Partial<User> | null>(null);
```

#### ❌ Missing Error Handling
```javascript
// BAD: No .catch(), assumes happy path
fetch('/api/data').then(res => res.json()).then(setData);
```

**✅ Solution:** Explicit error states and user feedback
```javascript
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Network response failed');
  const data = await response.json();
  setState({ status: 'success', data });
} catch (error) {
  setState({ status: 'error', error });
}
```

#### ❌ Hardcoded Values & Fragility
```javascript
// BAD: Hardcoded URL, no loading state, no duplicate submission prevention
const handleSave = () => {
  fetch('https://api.example.com/users/123', {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
};
```

**✅ Solution:** Configurable, defensive, user-aware code
```javascript
const handleSave = async () => {
  if (isSaving) return; // Prevent double submission
  
  try {
    setIsSaving(true);
    const updated = await updateUser(userId, editForm);
    setState({ status: 'success', data: updated });
    onUpdate?.(updated);
  } catch (error) {
    showErrorToast('Failed to save changes');
  } finally {
    setIsSaving(false);
  }
};
```

---

## 4. 🛡️ Error Handling & Robustness

### Comprehensive Error Management
- **Write code that is maintainable, with proper error handling and clear boundaries for functionality**
- **Never assume the happy path** — handle network failures, slow connections, and user errors
- Provide explicit loading, error, and success states using state machines:
  ```typescript
  type FetchState<T> = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```

### User Feedback
- Show loading states during async operations
- Disable buttons during submission to prevent double-clicks
- Display user-friendly error messages (not just console logs)
- Handle edge cases: network disconnection, timeout, invalid responses

---

## 5. 🔒 Security Best Practices

### Security Checklist
- **Optimize for performance and security by following best practices**
- **Never hardcode API keys, tokens, or secrets** in source code
- **Include authorization headers** in API requests — don't assume public APIs
- **Sanitize all user inputs** before using in queries or rendering
- **Avoid SQL/NoSQL injection** — never concatenate user input into queries
- Use environment variables for configuration (`.env` files)
- Implement proper authentication and authorization checks

### AI-Generated Code Risks
- AI may assume public APIs and omit auth headers (leading to silent 401 failures)
- AI may hallucinate libraries that don't exist — **always verify imports**
- AI training cutoffs may suggest deprecated or vulnerable libraries

---

## 6. 📚 Documentation & Comments

### Meaningful Documentation
- **Include concise, meaningful inline comments and documentation to explain non-obvious logic**
- Document **why**, not **what** — the code shows what it does, comments explain the reasoning
- Add JSDoc/TSDoc for public APIs and complex functions:
  ```typescript
  /**
   * Fetches user data with automatic retry logic
   * @param userId - The unique user identifier
   * @param signal - AbortSignal for cancellation
   * @returns Promise resolving to User object
   * @throws {NetworkError} When max retries exceeded
   */
  async function fetchUser(userId: string, signal: AbortSignal): Promise<User>
  ```

---

## 7. ✅ Testing & Verification

### Test Coverage
- **Incorporate unit tests or example test cases to demonstrate and verify functionality**
- Test edge cases: empty states, error conditions, boundary values
- Test async behavior: race conditions, cancellation, timeouts
- Use integration tests for critical user flows

### Audit AI-Generated Code
When reviewing AI-generated code (or any code), check for:

1. **Happy Path Fallacy** — Does it assume the network never fails?
2. **Security Scan** — Are inputs sanitized? Are secrets exposed?
3. **Complexity Creep** — Does it reinvent existing utilities?
4. **Hallucination Check** — Do all imports exist? Are libraries current?
5. **Race Conditions** — Can rapid state changes corrupt data?

---

## 8. 🎨 Code Style & Standards

### Consistency
- **Adhere to established coding standards and style guides relevant to the language or framework**
- Use ESLint/Prettier or similar tools for automatic formatting
- Follow project-specific conventions consistently
- Maintain consistent indentation, spacing, and bracket style

### Simplicity Over Cleverness
- **Avoid overly complex or deeply nested structures by favoring simplicity and clarity**
- Prefer explicit code over "clever" shortcuts
- Keep functions small and focused (single responsibility principle)
- Reduce cognitive load — code should be easy to read and understand

---

## 9. ⚡ Performance Optimization

### Efficient Algorithms
- **Optimize for performance by using efficient algorithms**
- Avoid unnecessary re-renders or re-computations
- Use memoization (`useMemo`, `useCallback`) when appropriate
- Profile and measure before optimizing — avoid premature optimization

### Resource Management
- Clean up resources (timers, subscriptions, event listeners)
- Use pagination for large datasets
- Implement debouncing/throttling for frequent events
- Lazy load components and assets when possible

---

## 10. 🧩 Integration & Dependencies

### Minimal Dependencies
- Prefer native/standard library solutions over external packages when feasible
- Audit dependencies for security vulnerabilities regularly
- Avoid "dependency hell" — keep `node_modules` lean
- Check bundle size impact of new dependencies

### Reusability
- Write reusable components and utilities
- Check existing codebase before creating new utilities (avoid duplication)
- Design APIs that are intuitive and composable

---

## 11. Create Documentation & Code Comments

- **Include concise, meaningful inline comments and documentation to explain non-obvious logic**
- Document **why**, not just **what** — the code shows what it does, comments explain the reasoning
- Add JSDoc/TSDoc for public APIs and complex functions:

---

## Summary Checklist ✓

Before committing code, verify:

- [ ] **Specification-first approach** — types/interfaces defined upfront
- [ ] **CamelCase naming convention** applied consistently
- [ ] **No "slop code"** — race conditions handled, errors caught, states managed
- [ ] **Error handling** — loading/error/success states explicit
- [ ] **Security** — inputs sanitized, no hardcoded secrets, auth included
- [ ] **Documentation** — non-obvious logic explained
- [ ] **Tests** — critical paths covered, edge cases tested
- [ ] **Code style** — follows project standards, simple and clear
- [ ] **Performance** — efficient algorithms, resources cleaned up
- [ ] **No hallucinations** — all imports verified, libraries current

---

**Remember:** You are now an **auditor, not just a writer**. Generating code is easy; verifying its correctness, security, and maintainability is the real skill. Complexity cannot be hidden — you must understand your code to maintain it.