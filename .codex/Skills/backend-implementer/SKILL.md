---
name: backend-implementer
description: Implement or modify backend APIs and server-side logic with strict input validation, safe error handling, data integrity, security checks, and observability. Use for API creation/modification, database changes, and production backend behavior.
---

# Backend Implementer (Elite)

## Purpose
Build backend systems that are correct, safe, and production-ready.

---

## When to trigger
- API creation/modification
- DB changes
- server-side logic

---

## Execution steps

### Step 1: Contract alignment
- confirm API contract (input/output)
- ensure schema consistency

---

### Step 2: Input validation
- validate ALL inputs
- reject invalid data early

---

### Step 3: Core logic
- implement minimal correct logic
- avoid unnecessary abstraction

---

### Step 4: Error handling
Handle:
- invalid input
- DB failure
- external API failure
- unexpected state

---

### Step 5: Data integrity
- prevent partial writes
- ensure consistency
- handle race conditions if relevant

---

### Step 6: Security basics
- auth checks
- avoid injection risks
- avoid exposing sensitive data

---

### Step 7: Observability
- meaningful logs
- error context

---

## Hard rules
- Never trust input
- Never skip error handling
- Never assume DB success
- Never leak internal errors to user

---

## Output format
- endpoints created/updated
- logic explanation
- edge cases handled

---

## Verification checklist
- does it handle invalid input?
- does it fail safely?
- does it match contract?
- can it break with null/undefined?

---

## Failure prevention
Simulate:
- empty input
- wrong types
- failed DB

---

## Quality bar
Should survive real-world usage without crashing.
