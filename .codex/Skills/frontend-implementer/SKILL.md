---
name: frontend-implementer
description: Build resilient frontend UI and integration flows with explicit loading/success/error/empty states, strict API contract alignment, input validation, and failure-safe behavior. Use for UI creation, API wiring, and client-side state handling.
---

# Frontend Implementer (Elite)

## Purpose
Build UI that is correct, resilient, and fully integrated.

---

## When to trigger
- UI creation
- API integration
- state handling

---

## Execution steps

### Step 1: State design
Define:
- loading
- success
- error
- empty

---

### Step 2: API integration
- match backend contract EXACTLY
- handle response + error cases

---

### Step 3: Input handling
- validate user input
- prevent invalid submissions

---

### Step 4: UI resilience
- loading states visible
- errors clearly handled
- fallback states present

---

### Step 5: Consistency
- follow design system
- reuse components

---

## Hard rules
- No "happy path only"
- No silent failures
- No fake/mock data in real flows

---

## Output
- components
- state logic
- API wiring

---

## Verification checklist
- what happens on API failure?
- what happens with empty data?
- what happens during loading?

---

## Quality bar
UI should never break even if backend fails.
