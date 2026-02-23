

# 📘 FRAMES Engineering Standards & Optimization Rules

## Purpose

This document defines the mandatory engineering rules, architectural principles, and performance standards for the FRAMES Capstone project.

All contributors and AI coding agents must follow these rules strictly to ensure:

* Scalability
* Performance
* Maintainability
* Clean Architecture
* Long-term extensibility

---

# 1️⃣ Core Engineering Philosophy

### 1.1 Optimize for Scale, Not Just Functionality

Code must not only “work” — it must scale.

Before implementing any logic, ask:

* What happens if data grows 10x?
* What happens if users grow 100x?
* What happens if camera streams increase?

If performance degrades exponentially, redesign.

---

### 1.2 Avoid Repeated Work

Repeated expensive operations must be eliminated.

Expensive operations include:

* Database queries
* Network/API calls
* Disk I/O
* Image processing
* Face recognition comparisons
* Encryption/decryption
* File reads/writes

Never place expensive operations inside loops without strong justification.

---

# 2️⃣ Big O Performance Rules

All contributors must understand algorithmic complexity.

### Acceptable Complexities

* O(1) — Preferred
* O(log n) — Excellent
* O(n) — Acceptable
* O(n log n) — Acceptable for sorting

### Avoid If Possible

* O(n²)
* O(2ⁿ)
* Any nested loop without justification

If nested loops are used, document why.

---

# 3️⃣ Strict Rule: No N+1 Queries

## 3.1 Definition

N+1 happens when:

1 query retrieves a list
Then N additional queries are executed inside a loop

Example (FORBIDDEN):

```kotlin
val users = userRepository.getAll()

for (user in users) {
    val logs = logRepository.getByUserId(user.id)
}
```

This results in 1 + N database queries.

---

## 3.2 Required Solution

Instead:

* Use JOIN queries
* Use batch queries
* Fetch in bulk
* Group in memory

Example (APPROVED):

```kotlin
val users = userRepository.getAll()
val userIds = users.map { it.id }

val logs = logRepository.getByUserIds(userIds)
val logsByUser = logs.groupBy { it.userId }
```

Maximum allowed database calls for related datasets:

* 1–2 queries total
* Never N+1

---

# 4️⃣ Database Design Rules

### 4.1 Always Use Indexes For:

* Foreign keys
* Frequently filtered columns
* Search fields
* Timestamps used in ordering

### 4.2 Never:

* Perform filtering in memory if it can be done in SQL
* Load entire tables when filtering is possible
* Use SELECT * in production code

---

# 5️⃣ Face Recognition Optimization (FRAMES Specific)

For camera processing:

### 5.1 NEVER:

* Query database per detected face
* Reload embeddings per frame
* Perform redundant re-encoding

### 5.2 REQUIRED:

* Preload embeddings into memory at session start
* Cache embeddings
* Use efficient in-memory structures (HashMap, KD-tree if applicable)
* Batch comparisons when possible

---

# 6️⃣ Caching Strategy

Use caching when:

* Data rarely changes
* Reads are frequent
* Computation is expensive

Cache levels:

* In-memory cache
* Local database cache
* Server cache (if applicable)

All caches must have:

* Expiration strategy
* Invalidation logic

---

# 7️⃣ Loop Rules

Before writing any loop:

Ask:

1. Is there a database call inside?
2. Is there a network call inside?
3. Is there heavy computation inside?

If yes → redesign.

---

# 8️⃣ Data Structure Rules

Use correct structures:

| Use Case          | Required Structure |
| ----------------- | ------------------ |
| Fast lookup       | HashMap            |
| Unique values     | Set                |
| Ordered data      | List               |
| Key-value mapping | Map                |
| Frequent search   | Indexed DB column  |

Avoid using List.contains() repeatedly in large datasets.

Convert to Set for O(1) lookup.

---

# 9️⃣ Clean Architecture Rules

FRAMES must follow separation of concerns:

* UI Layer → Presentation only
* ViewModel → State management
* UseCase / Service → Business logic
* Repository → Data access
* Database / Network → External layer

No database calls directly inside UI.

---

# 🔟 Logging & Monitoring

All critical operations must log:

* Execution time
* Query duration
* Face recognition processing time
* Frame processing latency

Performance metrics must be measurable.

---

# 1️⃣1️⃣ Code Review Checklist

Before merging:

* No N+1 queries
* No database inside loops
* Big O complexity evaluated
* Proper indexing applied
* No redundant recomputation
* Proper caching applied
* Clear separation of concerns
* Memory usage considered

If any of these fail → refactor.

---

# 1️⃣2️⃣ Performance Targets (FRAMES)

Target system behavior:

* Camera frame processing < 200ms per frame
* Face comparison optimized for batch processing
* Database queries < 100ms
* No exponential growth patterns

---

# 1️⃣3️⃣ Engineering Mindset Rule

Every feature must answer:

* Is this scalable?
* Is this efficient?
* Is this maintainable?
* What breaks at scale?

If unsure → redesign before implementation.

---

# Final Principle

Working code is not enough.

Efficient, scalable, clean code is required.

FRAMES must be engineered, not just coded.

---


