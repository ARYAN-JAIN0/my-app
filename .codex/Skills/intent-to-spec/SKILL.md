---
name: intent-to-spec
description: Convert ambiguous or high-level product requests into a precise, implementation-ready engineering specification before any non-trivial implementation. Use when requirements are incomplete, multiple interpretations are possible, or the request needs structured goal/outcome/input-output/constraints/edge-case definition.
---

# Intent -> Spec (Elite)

## Purpose
Convert ambiguous user input into a precise, implementation-ready engineering specification.

This is a mandatory pre-step before any non-trivial implementation.

---

## When to trigger
Use when:
- request is vague, high-level, or product-focused
- requirements are incomplete
- multiple interpretations are possible

Do NOT use when:
- user provides exact API, schema, or implementation instructions

---

## Core principle
Wrong understanding = guaranteed wrong implementation.

---

## Execution steps

### Step 1: Extract true intent
- What is the user REALLY trying to achieve?
- What problem is being solved?
- What is success from the user's perspective?

---

### Step 2: Define user outcome
- What should the user see or experience?
- What changes in behavior/system state?

---

### Step 3: Define inputs & outputs
- Inputs (user actions, data)
- Outputs (UI, API response, DB change)

---

### Step 4: Define constraints
- performance
- security
- UX constraints
- business logic constraints

---

### Step 5: Define edge cases
Explicitly list:
- empty input
- invalid input
- network/API failure
- partial data
- concurrency issues (if relevant)

---

### Step 6: Define non-goals
Prevent scope creep:
- what is NOT included

---

### Step 7: Define success criteria
Clear, testable:
- "Feature works" is invalid
- Must be verifiable

---

### Step 8: Risk detection
List:
- unclear areas
- possible misinterpretations
- missing dependencies

---

## Output format (STRICT)

### Goal
...

### User Story
...

### Inputs
...

### Outputs
...

### Constraints
...

### Edge Cases
...

### Non-goals
...

### Success Criteria
...

### Risks / Assumptions
...

---

## Hard rules
- Never skip this for complex tasks
- Never proceed if spec is unclear
- If ambiguity is high -> state assumption explicitly

---

## Failure prevention
Before finishing:
- Ask: "Could this be interpreted differently?"
- If yes -> refine spec

---

## Quality bar
Another engineer should be able to implement WITHOUT asking questions.
