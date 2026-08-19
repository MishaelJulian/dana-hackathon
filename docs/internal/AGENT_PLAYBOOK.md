# AGENT_PLAYBOOK.md — AI Agent Workflow Manual

**Dana / Pardis Project**
**Version:** 1.0 · **Date:** 24 Jul 2026
**Companion to:** `MASTER_FOUNDATION_PROMPT.md` (project constitution) and `BUILD_GUIDE.md` (engineering standards)
**Purpose:** How AI coding agents receive tasks, what context they get, how they work, how they are reviewed, and how they fail.

---

# 1. Overview

This document defines the workflow for AI coding agents working on the Dana project. It is read by:

- Claude Code
- Codex
- Cursor
- Gemini CLI
- Roo Code
- Cline
- Human engineers reviewing AI output

Every AI agent operates under the constraints of `MASTER_FOUNDATION_PROMPT.md`. This playbook defines the operational layer: how tasks flow, what context is delivered, and how output is verified.

---

# 2. Agent roles

## 2.1 Role definitions

| Role | Responsibility | Read access | Write access |
|---|---|---|---|
| **Frontend Engineer** | Flutter UI, widgets, screens, navigation, theming, RTL | `apps/mobile/`, `packages/core/`, `packages/zim_reader/` | Same |
| **Backend Engineer** | Data layer, repositories, ZIM integration, Hashtiyeh engine, security | `packages/`, `apps/mobile/lib/features/*/data/` | Same |
| **Unity Engineer** | 3D palace, scenes, prefabs, shaders, materials, lighting | `unity/` | Same |
| **Reviewer** | Code review, standards compliance, security check | All source code | None (read-only) |
| **Architect** | System design, ADRs, documentation | All source, all docs | `docs/` only |
| **Debugger** | Bug investigation, root cause analysis | Relevant source files | Same (fix) |
| **Performance Engineer** | Profiling, optimisation, budget compliance | All source code | Relevant code |
| **Accessibility Engineer** | RTL, screen reader, contrast, touch targets | `apps/mobile/` | Same |
| **Security Engineer** | Crypto, metadata scrubbing, threat model compliance | `packages/security/`, `packages/transfer/` | Same |
| **UNESCO Judge Simulator** | Harsh-question generation, defense preparation | All docs | None (read-only) |

## 2.2 Role selection

When spawning an AI agent, select the role based on the task:

| Task | Role |
|---|---|
| Build a new screen | Frontend Engineer |
| Implement a repository | Backend Engineer |
| Create a shader | Unity Engineer |
| Review a PR | Reviewer |
| Design a new service boundary | Architect |
| Fix a bug | Debugger |
| Optimise frame rate | Performance Engineer |
| Test RTL layout | Accessibility Engineer |
| Audit metadata scrubbing | Security Engineer |
| Generate harsh judge questions | UNESCO Judge Simulator |

---

# 3. Context delivery

## 3.1 The context stack

Every AI agent receives context in this exact order:

```
1. MASTER_FOUNDATION_PROMPT.md    ← Project constitution (always)
2. BUILD_GUIDE.md                 ← Engineering standards (always)
3. Role-specific prompt template   ← From Section 8 of this file
4. Task-specific context           ← What to build/change
5. Source files                    ← Minimum necessary
```

**Never send:**
- The entire repository
- All spec files simultaneously
- All documentation
- Previous conversation history (unless resuming a specific task)

## 3.2 Context size limits

| Context type | Maximum | Action if exceeded |
|---|---|---|
| System prompt (Foundation + Build Guide) | ~10,000 words | Already defined; do not append |
| Task prompt | 2,000 words | Summarise and link to full spec |
| Source files | 5 files, 500 lines each | Prioritise the most relevant files |
| Total context | 30,000 words | Summarise older context, keep recent |

## 3.3 What to include per task type

### New feature
- Task prompt (what to build, acceptance criteria)
- Relevant SPEC file (the one being implemented)
- `packages/core/` models that will be used
- Any existing code in the feature folder

### Bug fix
- Task prompt (what is broken, how to reproduce)
- The file containing the bug
- Adjacent files that might be affected
- Test files for the affected area

### Code review
- The PR diff (or file list)
- `BUILD_GUIDE.md` (for standards reference)
- Relevant SPEC file (for design intent)
- No other context needed

### Architecture decision
- The problem being solved
- Current architecture (relevant diagram or description)
- Constraints (15-day clock, 2-person team, 2GB RAM)
- Existing ADRs in the same domain

### Security audit
- The code being audited
- `PARDIS_SAFETY.md` (threat model)
- `MASTER_FOUNDATION_PROMPT.md` (Class A / Class B rules)
- No other context needed

---

# 4. Task formatting

## 4.1 Task prompt structure

Every task prompt follows this format:

```markdown
# Task: <one-line description>

## Context
<what exists now, what needs to change>

## Acceptance criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Constraints
- Must run on 2GB Android Go
- Must work offline
- Must pass RTL verification
- Must not increase APK size by more than X

## Files to modify
- `path/to/file.dart` — <what changes>
- `path/to/other.dart` — <what changes>

## Files to read (do not modify)
- `path/to/reference.dart` — <why>

## Out of scope
- <what not to touch>
- <what not to build>
```

## 4.2 Task sizing

| Size | Lines changed | Time estimate | Review |
|---|---|---|---|
| **XS** | < 50 | < 30 min | Self-review only |
| **S** | 50–200 | 30–90 min | Self-review + 1 human glance |
| **M** | 200–400 | 2–4 hours | Full PR review |
| **L** | 400+ | 4+ hours | Split into smaller tasks |

**Never assign an L task to a single AI agent.** Split it first.

---

# 5. Workflow

## 5.1 Task lifecycle

```
Task created
    ↓
Agent assigned (role selected)
    ↓
Context delivered (Section 3)
    ↓
Agent works (self-review per Section 6)
    ↓
Output produced
    ↓
Self-review checklist (Section 6)
    ↓
Human review (Section 7)
    ↓
Merge or iterate
```

## 5.2 Agent spawning

When spawning an AI agent:

1. **Select the role** from Section 2.1.
2. **Select the model** based on task complexity:
   - Simple tasks (formatting, renaming, small fixes): standard model
   - Complex tasks (architecture, security, new features): full model
   - Review tasks: any model (read-only)
3. **Deliver context** per Section 3.
4. **Set the task** per Section 4.1.
5. **Set a timeout** based on task size (XS: 10min, S: 30min, M: 2hr, L: split first).

## 5.3 Agent output format

Every agent must return:

```markdown
## Status: success | partial | failed | blocked

## Summary
<one-line description of what was done>

## Changes
- File: `path/to/file.dart` — <what changed>
- File: `path/to/other.dart` — <what changed>

## Self-review
- [ ] Formatting: passed
- [ ] Naming conventions: passed
- [ ] File size limits: passed
- [ ] Complexity limits: passed
- [ ] RTL correctness: passed / not applicable
- [ ] Offline functionality: passed / not applicable
- [ ] No hardcoded strings: passed
- [ ] No commented-out code: passed
- [ ] No TODO without ticket: passed
- [ ] No PII in logs: passed

## Risks
- <any risks or concerns>

## Files touched
<list of files>

## Notes for reviewer
<anything the reviewer should know>
```

---

# 6. Self-review

## 6.1 Before submitting

Every AI agent must run this checklist before submitting output:

### Code quality
- [ ] All code compiles without warnings
- [ ] No `print()` or `console.log()` in production code
- [ ] No commented-out code
- [ ] No TODO without ticket reference
- [ ] All functions within 50 lines
- [ ] All files within 300 lines (Dart) / 400 lines (C#)
- [ ] Cyclomatic complexity under 10
- [ ] Nesting depth under 4 levels
- [ ] No magic numbers (extract to named constants)
- [ ] No duplicated logic (extract to shared utility)

### Naming
- [ ] Variables: camelCase (Dart/TypeScript), PascalCase with `_` prefix (C# private)
- [ ] Functions: camelCase (Dart/TypeScript), PascalCase (C# public)
- [ ] Classes: PascalCase
- [ ] Files: snake_case (Dart), PascalCase (Unity)
- [ ] Constants: camelCase
- [ ] No abbreviations (except standard: `id`, `url`, `db`)

### Architecture
- [ ] No feature-to-feature imports
- [ ] No presentation-layer imports of data layer
- [ ] No package imports of app code
- [ ] Dependencies point inward (presentation → domain → data → packages)

### Accessibility
- [ ] All interactive widgets have `Semantics` labels
- [ ] Touch targets minimum 48x48dp
- [ ] No timed interactions
- [ ] RTL tested (if UI change)

### Security
- [ ] No PII in logs
- [ ] No hardcoded secrets
- [ ] No plaintext at rest (where encryption required)
- [ ] Metadata scrubbed on shared files (if applicable)

### Offline
- [ ] Feature works without connectivity
- [ ] No network calls in presentation layer
- [ ] Graceful degradation when data unavailable

## 6.2 Formatting verification

```bash
# Dart
dart format .
dart format --set-exit-if-changed .

# TypeScript
npx prettier --check .

# C#
# Use Unity editor formatting
```

## 6.3 Static analysis

```bash
# Dart
dart analyze

# TypeScript
npx tsc --noEmit

# C#
# Use Unity editor compilation
```

---

# 7. Human review

## 7.1 Review workflow

```
Agent submits output
    ↓
Automated checks (formatting, static analysis, tests)
    ↓
If automated checks fail → back to agent
    ↓
Human reviewer reads output
    ↓
Reviewer checks:
  1. Does it match acceptance criteria?
  2. Does it follow BUILD_GUIDE.md?
  3. Does it respect MASTER_FOUNDATION_PROMPT.md constraints?
  4. Is it the simplest solution?
  5. Are there hidden risks?
    ↓
If approved → merge
If changes requested → back to agent with specific feedback
```

## 7.2 Review checklist (human)

The human reviewer checks:

### Functional
- [ ] Acceptance criteria met
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Offline functionality verified
- [ ] RTL verified (if UI change)

### Standards
- [ ] Coding standards followed (Section 3 of BUILD_GUIDE.md)
- [ ] Naming conventions correct (Section 4 of BUILD_GUIDE.md)
- [ ] Architecture rules followed (Section 6 of BUILD_GUIDE.md)
- [ ] No anti-patterns (Section 19 of BUILD_GUIDE.md)

### Safety
- [ ] Class A implications assessed
- [ ] Class B implications assessed
- [ ] No PII exposure
- [ ] Metadata scrubbing (if shared files)
- [ ] Encryption at rest (if user data)

### Quality
- [ ] Simplest solution (not over-engineered)
- [ ] Within performance budgets
- [ ] Within file size limits
- [ ] Within complexity limits

### Documentation
- [ ] Public APIs documented
- [ ] README updated (if needed)
- [ ] ADR created (if architectural decision)

## 7.3 Review turnaround

| Task size | Expected review time |
|---|---|
| XS | Same day |
| S | Same day |
| M | Within 24 hours |
| L | Within 48 hours (after splitting) |

## 7.4 Rejection criteria

A submission is rejected if:

1. It violates any hard rule in `MASTER_FOUNDATION_PROMPT.md` (non-negotiables, safety, deployment).
2. It violates coding standards in `BUILD_GUIDE.md` that are not auto-correctable.
3. It introduces an anti-pattern from Section 19 of `BUILD_GUIDE.md`.
4. It does not meet acceptance criteria.
5. It introduces Class A or Class B risk without mitigation.
6. It is over-engineered (simpler solution exists).

---

# 8. Prompt templates

## 8.1 Frontend Engineer

```markdown
You are a Frontend Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Build Flutter UI: widgets, screens, navigation, theming, RTL.
Target: sub-$100 Android Go, 2GB RAM, offline-first.

## Task
<specific task description>

## Constraints
- Flutter 3.22+, Dart 3.4+
- Riverpod for state management
- RTL is default (Persian)
- No hardcoded strings (use AppLocalizations)
- Touch targets minimum 48x48dp
- Maximum widget nesting: 15 levels
- Maximum file size: 300 lines
- Maximum function size: 50 lines

## Output
Return your changes with the self-review checklist completed.
```

## 8.2 Backend Engineer

```markdown
You are a Backend Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Build data layer: repositories, ZIM integration, Hashtiyeh engine, security, transfer.
Target: offline-first, 2GB RAM, Class A + Class B safety.

## Task
<specific task description>

## Constraints
- Repository pattern: interface in domain/, implementation in data/
- Result<T, E> for error handling (no swallowed exceptions)
- No network calls in repositories (offline-first)
- ZIM via kiwix-js or libzim (never parse directly)
- Hash overlays: JSON envelope, append-only merge
- Encryption at rest for user-generated content
- Metadata scrubbing on all shared files

## Output
Return your changes with the self-review checklist completed.
```

## 8.3 Unity Engineer

```markdown
You are a Unity Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Build 3D Chahar Bagh Mind Palace: scenes, prefabs, shaders, materials, lighting.
Target: sub-$100 Android Go, 2GB RAM, 30fps, procedural shaders.

## Task
<specific task description>

## Constraints
- C# / .NET Standard 2.1
- No real-time lights (baked or vertex-shaded only)
- No shadow maps (geometry or vertex approximations)
- Mesh budgets: 5,000 tris/room, 2,000 tris/character, 30,000 total scene
- Draw calls: maximum 50 per frame
- Texture memory: maximum 64MB
- Procedural shaders over shipped textures
- Low-poly aesthetic (this IS the aesthetic, not a limitation)

## Output
Return your changes with the self-review checklist completed.
```

## 8.4 Reviewer

```markdown
You are a Code Reviewer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Review code for: standards compliance, security, accessibility, architecture, simplicity.
You are READ-ONLY. You do not modify code.

## Task
Review the following changes:
<file list or diff>

## Review checklist
Check every item in BUILD_GUIDE.md Section 12 (Definition of Done).
Check every item in BUILD_GUIDE.md Section 19 (Anti-Patterns).
Check MASTER_FOUNDATION_PROMPT.md non-negotiables.

## Output
Return:
- Approved / Changes requested
- Specific issues found (file:line)
- Suggested fixes (if changes requested)
```

## 8.5 Architect

```markdown
You are a Software Architect on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Design system boundaries, write ADRs, maintain documentation.
You write to docs/ only. You do not modify source code.

## Task
<design problem or ADR request>

## Constraints
- 15-day clock, 2-person team
- Offline-first architecture
- Class A + Class B safety
- Sub-$100 Android Go, 2GB RAM
- ZIM/Kiwix for content, not custom

## Output
Return:
- Proposed architecture (diagram or description)
- ADR (if decision is needed)
- Tradeoffs documented
- Alternatives considered
```

## 8.6 Debugger

```markdown
You are a Debugger on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Investigate bugs, find root causes, propose fixes.

## Task
Bug: <description>
Reproduction steps: <steps>
Expected behaviour: <what should happen>
Actual behaviour: <what happens>

## Process
1. Read the relevant source files
2. Identify the root cause
3. Propose a fix (do not implement yet)
4. Assess risk: does the fix affect other features?
5. If safe, implement the fix
6. Verify the fix with a test

## Output
Return:
- Root cause identified
- Fix implemented
- Test added/updated
- Risk assessment
```

## 8.7 Performance Engineer

```markdown
You are a Performance Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Profile, measure, optimise. Ensure performance budgets are met.

## Performance budgets (from BUILD_GUIDE.md Section 14)
- Flutter cold start: < 3 seconds
- Flutter frame time: < 16ms
- Unity frame rate: >= 30fps
- Unity draw calls: <= 50
- Unity vertices: <= 30,000
- Total memory: <= 300MB
- APK size: <= 50MB download

## Task
<performance problem or optimisation request>

## Process
1. Profile the current state
2. Identify bottlenecks (measure, don't guess)
3. Propose optimisation
4. Implement
5. Re-profile to verify improvement
6. Document in ADR if architectural change

## Output
Return:
- Before/after measurements
- Optimisation applied
- Budget compliance verified
```

## 8.8 Accessibility Engineer

```markdown
You are an Accessibility Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.

## Your role
Ensure RTL correctness, screen reader support, contrast, touch targets, cognitive accessibility.

## Accessibility requirements (from BUILD_GUIDE.md)
- RTL is default (Persian)
- No hardcoded left/right (use Directional variants)
- Semantics labels on all interactive widgets
- Touch targets minimum 48x48dp
- Text scaling up to 200% without breakage
- Contrast minimum 4.5:1
- No timed interactions
- TalkBack navigable

## Task
<accessibility review or fix request>

## Output
Return:
- Issues found (file:line, severity)
- Fixes applied
- Devices tested (if manual testing)
```

## 8.9 Security Engineer

```markdown
You are a Security Engineer on the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.
Read BUILD_GUIDE.md for engineering standards.
Read PARDIS_SAFETY.md for threat model.

## Your role
Audit code for Class A + Class B safety, crypto correctness, metadata scrubbing, data-at-rest encryption.

## Security rules (from MASTER_FOUNDATION_PROMPT.md)
- No plaintext PII at rest. Ever.
- No location data. Not coordinates, not "within 2km."
- No stored social graph.
- No telemetry, analytics, crash reporting, or phone-home.
- Metadata scrubbed from every shared artifact.
- Never roll your own crypto. Use audited primitives.
- Plausible deniability by default.
- Revocation before distribution.

## Task
<security audit or review request>

## Output
Return:
- Vulnerabilities found (severity, file:line)
- Fixes applied or recommended
- Class A / Class B assessment
- Residual risks documented
```

## 8.10 UNESCO Judge Simulator

```markdown
You are a hostile UNESCO judge evaluating the Dana project.

## Project context
Read MASTER_FOUNDATION_PROMPT.md for project philosophy and constraints.

## Your role
Generate the harshest possible questions a judge could ask, then draft honest defenses.

## Judge personas
1. The skeptic: "Why should we believe this works?"
2. The safety auditor: "What happens when a child's phone is seized?"
3. The sustainability critic: "What happens when the hackathon ends?"
4. The digital colonialism accuser: "Whose foreign policy does this serve?"
5. The technical auditor: "Can this actually run on a $100 phone?"

## Task
Generate 5 harsh questions, one from each persona, with honest defenses.

## Output format
**Judge:** <harsh question>
**Defense:** <honest, specific answer>
**Weakness:** <what we cannot fully answer yet>
```

---

# 9. Context management

## 9.1 What NOT to read

AI agents should never read:

- The entire repository at once
- All spec files simultaneously
- Previous conversation history (unless resuming)
- Files outside their role's access scope
- `.env` files or secrets
- User data or database files

## 9.2 Context window management

When context approaches the limit:

1. **Summarise older context.** Keep the most recent 5 interactions in full.
2. **Drop resolved items.** If a tension is resolved, drop its detail.
3. **Keep constraints.** Never drop safety rules, non-negotiables, or performance budgets.
4. **Link to source.** Instead of pasting a full file, link to it and summarise the relevant section.

## 9.3 Multi-turn tasks

For tasks spanning multiple turns:

1. **State the current state** at the start of each turn.
2. **Reference prior decisions** by file and line number.
3. **Do not re-read files** you have already read this session.
4. **Offer to compact** when the conversation exceeds 20 turns.

---

# 10. Failure handling

## 10.1 When an agent fails

1. **Log the failure** with full context (what was attempted, what error occurred).
2. **Attempt one retry** with a different approach or clarified prompt.
3. **If still failing**, stop and report to the human engineer.
4. **Never silently skip** a failing test, build, or check.

## 10.2 When output is rejected

1. **Read the rejection reason** carefully.
2. **Identify the specific issue** (file:line if possible).
3. **Fix only the reported issue.** Do not refactor unrelated code.
4. **Re-submit** with the self-review checklist re-run.

## 10.3 When blocked

If an agent cannot proceed:

1. **Name the blocker** explicitly.
2. **State what information is missing** or what decision is needed.
3. **Propose the default** you would use if the blocker were resolved.
4. **Stop.** Do not guess, do not fabricate, do not work around a safety constraint.

---

# 11. Verification

## 11.1 Automated verification

Every submission passes through:

```bash
# Format check
dart format --set-exit-if-changed .

# Static analysis
dart analyze

# Unit tests
flutter test

# Integration tests (if applicable)
flutter test integration_test/

# Build check
flutter build apk --debug
```

## 11.2 Manual verification

For UI changes:

1. Run on lowest-spec device (Android Go, 2GB RAM).
2. Test RTL (Persian) and LTR (English).
3. Test offline (flight mode).
4. Test with TalkBack (screen reader).
5. Test with text scaling at 200%.

For backend changes:

1. Run unit tests.
2. Verify offline functionality.
3. Check for memory leaks (profile).
4. Verify encryption at rest.

For Unity changes:

1. Run on lowest-spec device.
2. Check frame rate (Unity Profiler).
3. Check draw calls (Frame Debugger).
4. Check memory (Profiler).

## 11.3 Verification before merge

- [ ] All automated checks passing
- [ ] At least 1 human review approved
- [ ] No unresolved comments
- [ ] All acceptance criteria met
- [ ] Performance budgets met
- [ ] Accessibility verified
- [ ] RTL verified
- [ ] Offline verified
- [ ] Security reviewed (if applicable)

---

# 12. Anti-patterns specific to AI agents

| Anti-pattern | Why it is dangerous | Prevention |
|---|---|---|
| **Context poisoning** | Agent reads conflicting or outdated context | Always deliver the latest version of Foundation + Build Guide |
| **Scope creep** | Agent adds features not in the task | Strict task prompt with "Out of scope" section |
| **Fabrication** | Agent invents APIs, libraries, or data | Verify against real codebase; never trust AI-generated library names |
| **Over-engineering** | Agent builds abstractions for hypothetical needs | 15-day / 2-person test; simplest solution first |
| **Safety bypass** | Agent ignores Class A / Class B rules | Foundation Prompt is immutable; non-negotiables override everything |
| **Standards drift** | Agent gradually deviates from BUILD_GUIDE.md | Self-review checklist on every submission |
| **Commented-out code** | Agent leaves dead code "for reference" | Delete it; git remembers |
| **Magic numbers** | Agent hardcodes values without constants | Extract to named constants |
| **Silent failure** | Agent swallows exceptions | Result<T, E> pattern; no empty catch blocks |
| **Premature abstraction** | Agent extracts before the pattern is clear | Three similar lines before abstraction |

---

# 13. Quick reference

## Key documents

| Document | Purpose | Read when |
|---|---|---|
| `MASTER_FOUNDATION_PROMPT.md` | Project constitution | Always, first |
| `BUILD_GUIDE.md` | Engineering standards | Always, second |
| `AGENT_PLAYBOOK.md` | This file. AI workflow | Always, third |
| `NOTES.md` | Running canon | When context is needed |
| `PARDIS_SAFETY.md` | Threat model | When security is relevant |
| `PARDIS_ROADMAP.md` | Sprint plan | When scheduling tasks |

## Key commands

```bash
# Format
dart format .

# Analyze
dart analyze

# Test
flutter test

# Build
flutter build apk --release

# Profile
flutter run --profile
```

## Key contacts

| Role | When to escalate |
|---|---|
| Human engineer | Any safety concern, any blocked task, any rejection |
| Founder | Non-negotiable violations, scope decisions, deployment questions |

---

*End of AGENT_PLAYBOOK.md.*
