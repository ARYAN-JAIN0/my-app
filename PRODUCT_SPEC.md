# PRODUCT_SPEC.md

## Existing frontend screens
The existing frontend already contains at least these screens:

### A. Import Leads screen
Visible behaviors from UI:
- Upload lead file area
- Accept CSV or XLSX
- "Select File" button
- import progress panel
- processing stages such as:
  - storing data
  - running RAG analysis
  - generating AI drafts
- "Download Template" button
- "Start Bulk Import" button
- import result card
- "Go to Workspace" button
- import log view

### B. Analytics screen
Visible behaviors from UI:
- summary cards
  - total leads processed
  - total leads contacted
  - contact rate
  - conversion rate
- export report button
- refresh data button
- search analytics input
- live processing stream table
- status filter
- conversion funnel panel
- approval analytics section
- system approval ratio
- high precision vectors
- friction analysis

### C. SDR Workspace screen
Visible behaviors from UI:
- topline KPI cards
  - new leads
  - pending approval
  - emails sent today
  - approval rate
- refresh
- review pending queue button
- search leads input
- filters/tabs:
  - priority
  - score
  - needs action
- lead list
- selected lead details
- subject line area
- AI draft body
- signal breakdown
- email score
- flags
- actions:
  - save draft
  - regenerate
  - reject
  - edit
  - approve & send

## Product behavior model

### Core workflow
1. User uploads leads by CSV/XLSX
2. System parses rows and validates data
3. Duplicates are detected and filtered
4. Leads are stored in database
5. Each lead is enriched/scored
6. RAG context is retrieved for lead + business rules
7. LLM generates initial outreach draft
8. Draft is shown in SDR workspace
9. Human can edit/regenerate/reject/save/approve
10. If approved, email is sent through Gmail
11. Thread and message IDs are stored
12. Replies are synced and linked back to the lead/thread
13. Reply analysis + drafting can occur via same AI stack
14. Analytics update from real events and records

## Real-world integration requirements

### Gmail
Must support:
- OAuth connect
- sending outbound email
- thread ID storage
- message ID storage
- syncing inbox replies
- linking replies to existing thread/lead

### AI
Must support:
- local LLM endpoint as primary
- optional OpenRouter/Groq fallback
- task-based prompts
- JSON-safe responses where possible

Suggested primary local models:
- Gemma 4
- Qwen 2.5 7B instruct

### RAG
Must support:
- business context retrieval
- offer context
- tone/policy/rules retrieval
- past message examples
- per-lead and per-thread memory
- ingestion of uploaded knowledge/rules/templates if present

## Database concepts

### Core entities
- user
- gmail account
- offer/business profile
- lead
- thread
- message
- approval
- import job
- import row
- processing event
- analytics snapshot or computed analytics views
- knowledge chunk/rule
- follow-up
- activity log

## Lead lifecycle
- imported
- validated
- duplicate_filtered
- queued
- scored
- draft_generated
- pending_approval
- approved
- sent
- replied
- negotiating
- won
- lost
- paused
- rejected

## Message lifecycle
- draft
- saved
- pending_approval
- approved
- sending
- sent
- failed
- rejected
- edited

## What each visible control should do

### Import Leads screen
- file upload area: upload and stage a csv/xlsx file
- select file: opens browser file picker
- download template: returns a sample import template with required columns
- start bulk import: creates an import job and processes all rows
- progress stages: reflect actual import job progress
- import complete card: real counts from completed import
- go to workspace: route to SDR workspace filtered to imported leads
- view import log: shows row-level outcomes and errors

### SDR Workspace
- search input: search leads by name/company/email
- priority filter: sort/filter by priority or urgency
- score filter: sort/filter by lead score
- needs action filter: show leads needing human attention
- lead list selection: load lead details + latest draft + signal breakdown
- save draft: persist current draft edits without sending
- regenerate: call AI generation again with current context and store new revision
- reject: reject draft and mark lead/message appropriately
- edit: enable editing mode and save edits
- approve & send: mark approved, send via Gmail, update metrics and states
- review pending queue: show list of all items pending approval
- refresh: reload current live data

### Analytics
- refresh data: refetch current computed analytics
- export report: generate downloadable report (csv or pdf acceptable if implemented cleanly)
- search analytics: search within processing stream/leads/events
- status filter: filter live stream by status
- summary cards: computed from real DB data
- conversion funnel: computed from lifecycle counts
- approval analytics: computed from approvals table
- friction analysis: derived from rejection patterns, flags, or configurable rules
- high precision vectors panel: derived insights based on lead/message performance and scores

## Dummy/demo data
Seed data is required for development/demo:
- sample business profile
- sample offer
- sample knowledge rules
- sample leads
- sample generated drafts
- sample analytics data derived from actual seeded rows, not hardcoded in UI

## Production quality expectation
This should be built as a serious working product.
No placeholder click handlers.
No fake buttons.
No dead UI.
No disconnected panels.
Everything visible should be backed by actual logic.