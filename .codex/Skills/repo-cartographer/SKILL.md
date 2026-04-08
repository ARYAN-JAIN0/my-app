# Repo Cartographer (Elite)

## Purpose
Build a mental model of the codebase before any modification.

---

## When to trigger
- before editing unfamiliar code
- before implementing new feature
- before debugging

---

## Execution steps

### Step 1: Identify environment
- framework (Next.js, Express, etc.)
- runtime (Node, Python, etc.)
- package manager
- monorepo vs single repo

---

### Step 2: Map structure
- frontend directory
- backend directory
- API routes
- DB layer
- config/env files
- test folders

---

### Step 3: Detect patterns
- naming conventions
- folder structure patterns
- API structure pattern
- state management pattern
- error handling pattern

---

### Step 4: Locate critical systems
- auth
- database access
- API clients
- middleware
- shared utilities

---

### Step 5: Identify change boundaries
- which files MUST change
- which files SHOULD NOT be touched

---

### Step 6: Risk scan
- tightly coupled areas
- legacy code
- duplicated logic
- unclear ownership

---

## Output format

### Tech Stack
...

### Structure Overview
...

### Key Patterns
...

### Critical Systems
...

### Safe Edit Zones
...

### Risk Areas
...

---

## Hard rules
- Never assume structure
- Never introduce new pattern if one exists
- Always follow existing conventions

---

## Quality bar
You should know EXACTLY where to implement before writing code.