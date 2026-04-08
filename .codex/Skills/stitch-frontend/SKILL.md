---
name: stitch-frontend
description: converts Stitch-generated inputs (PNG + HTML + instructions) into a production-grade, fully interactive frontend, optimized for Kodex execution constraints (low tokens, high output quality).
---
# Skill: Stitch → Frontend Compiler 

## What this skill does

Converts Stitch-generated inputs (PNG + HTML + instructions) into a **production-grade, fully interactive frontend**, optimized specifically for **Kodex execution constraints (low tokens, high output quality)**.

This skill is designed to:

* Minimize token usage
* Maximize structural clarity
* Enforce step-wise reasoning inside Kodex
* Produce clean, scalable frontend code (not static UI)

---

## When to use

Use this skill inside Kodex when:

* You want to convert a design into a working frontend
* You have limited token budget but need high-quality output
* You need structured, multi-step generation instead of one-shot prompts

---

## Input Contract (Strict)

Kodex performs best with **structured, compressed inputs**.

### Required Input Format

```json id="d7x2k1"
{
  "png_description": "...",
  "html": "...",
  "instructions": "..."
}
```

---

### Input Optimization Rules (CRITICAL)

#### 1. PNG → Convert BEFORE passing

DO NOT pass raw image.

Instead, convert PNG into:

* Layout description
* Component list
* Style tokens

Example:

```json id="a8n4pz"
{
  "layout": "2-column dashboard, sidebar left, header top",
  "components": ["navbar", "sidebar", "cards", "table", "filters"],
  "styles": {
    "primary_color": "#4F46E5",
    "radius": "8px",
    "spacing": "8pt grid"
  }
}
```

👉 This reduces ~80% token waste.

---

#### 2. HTML → Compress

* Remove inline styles
* Remove redundant divs
* Keep only semantic structure

---

#### 3. Instructions → Normalize

Convert to:

* Actions
* States
* Rules

Example:

```json id="0a8kdl"
{
  "actions": ["search", "filter", "open dropdown"],
  "states": ["loading", "empty", "active"],
  "rules": ["sidebar collapsible", "table sortable"]
}
```

---

## Core Execution Strategy (Kodex-Specific)

Kodex should NEVER do everything in one pass.

### Use a 4-Step Chain:

---

## Step 1: UI Schema Extraction

### Goal:

Convert inputs → unified UI schema

### Output:

```json id="4k92la"
{
  "components": [...],
  "layout": {...},
  "design_tokens": {...}
}
```

### Rules:

* Merge PNG + HTML
* PNG overrides HTML
* Keep output compressed

---

## Step 2: Component Architecture

### Goal:

Create reusable component tree

### Output:

```json id="9s3kqp"
{
  "App": {
    "Header": {},
    "Sidebar": {},
    "Main": {
      "Cards": [],
      "Table": {}
    }
  }
}
```

### Rules:

* No styling yet
* Focus on hierarchy only
* Deduplicate components

---

## Step 3: Behavior Model

### Goal:

Define interactivity

### Output:

```json id="3l2x8v"
{
  "state": {...},
  "events": [...],
  "bindings": [...]
}
```

### Rules:

* Map each UI element → action
* Include edge cases
* Keep logic minimal but complete

---

## Step 4: Code Generation (FINAL)

### Goal:

Generate frontend

### Output:

* React + Tailwind codebase
* Fully working components

### Rules:

* Use design tokens
* Implement real interactions
* Avoid placeholders

---

## Kodex Optimization Techniques

### 1. Token Compression

* Use JSON instead of prose
* Avoid repetition
* Use short keys when possible

BAD:
"button with blue color and rounded edges"

GOOD:

```json id="c2p8sd"
{ "btn": { "color": "primary", "radius": "md" } }
```

---

### 2. Progressive Expansion

Never generate full code at once.

Instead:

1. Schema
2. Structure
3. Logic
4. Code

---

### 3. Deterministic Prompts

Avoid vague instructions like:

* “make it beautiful”
* “add good UI”

Use:

* explicit tokens
* explicit behaviors

---

### 4. Priority Hierarchy

Kodex must follow:

1. PNG (visual truth)
2. Instructions (behavior)
3. HTML (structure hint)

---

## Output Requirements

The generated frontend MUST:

* Match layout and spacing precisely
* Include ALL components
* Have WORKING:

  * buttons
  * dropdowns
  * inputs
  * filters
* Be modular and reusable
* Be responsive
* Use clean architecture

---

## Default Tech Stack

- Next.js, React (framework + components)
- Tailwind CSS (styling)
- shadcn/ui (UI system)
- Zustand (state)
- React Hook Form (forms)
- Zod (validation)
- Framer Motion (animations)

---

## Edge Case Handling

Kodex must:

* Infer missing interactions from UI patterns
* Replace broken HTML structures
* Generate mock data if backend missing
* Handle empty / loading states
* Ensure accessibility basics

---

## Anti-Patterns (Strictly Forbidden)

* Static HTML output
* Non-functional UI
* Ignoring PNG structure
* Overly verbose code
* Repeating styles inline

---

## Success Criteria

The skill is successful if:

* Output looks like the PNG
* UI is fully interactive
* Code is production-ready
* Token usage is minimized
* No rework is needed

---

## Internal Execution Heuristic

Kodex should think like:

> “First understand → then structure → then add logic → then build”

NOT:

> “Generate everything at once”

---

## Summary

This skill turns Kodex into a **frontend compiler**, not a generator.

It:

* Compresses inputs
* Processes in stages
* Outputs production-grade frontend

Optimized for:

* Low tokens
* High accuracy
* Maximum usability

---
