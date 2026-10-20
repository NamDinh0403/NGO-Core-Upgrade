---
name: compact-product-ui
description: Design and refine compact, functional developer-tool interfaces. Use when reviewing or changing the NGO Core Upgrade web UI, especially when the UI becomes cluttered, oversized, or visually inconsistent.
---

# Compact Product UI

## Objective

Build a compact, professional developer tool that prioritizes task completion over decorative presentation.

The UI must feel like a focused engineering tool, not an enterprise dashboard filled with cards, badges, descriptions, and status panels.

## Mandatory Workflow

### 1. Inspect Before Changing

- Inspect the existing frontend structure, design tokens, components, layouts, and current implementation.
- Identify which elements were added or expanded in recent UI changes.
- Compare the current UI with the original design intent whenever previous screenshots or Git history are available.
- Identify the root causes of clutter before editing.
- Do not immediately rewrite the entire page.

### 2. Establish a Design Baseline

- Prefer the original compact layout unless there is evidence that it has a functional problem.
- Preserve existing working interactions, data bindings, validation, and API integrations.
- Reuse existing components and styling conventions.
- Avoid introducing another UI framework or design system unnecessarily.

### 3. Layout Rules

- One primary task should dominate each screen.
- Keep the default workflow visible and straightforward.
- Place advanced configuration behind a collapsible section or dedicated settings view.
- Use compact, consistent spacing and align related fields.
- Avoid nested cards, excessive borders, oversized headers, and redundant descriptions.
- Do not display the same state in multiple places.
- Use progressive disclosure: show details only when they help the user make a decision or resolve a problem.
- Keep primary actions obvious and secondary actions visually subordinate.
- Ensure the page fits common desktop viewports without unnecessary horizontal scrolling.

### 4. Upgrade Workflow UX

The default upgrade flow should be:

1. Select or discover the client project.
2. Select the target version.
3. Run preflight and inspect blockers.
4. Review the plan and safety gates.
5. Confirm and launch the upgrade.
6. Monitor execution and inspect the final report.

Do not expose internal orchestration details unless the user requests them.

Project discovery, version discovery, authentication, and validation must use real application state. Never replace broken functionality with decorative status indicators or hardcoded successful states.

### 5. Visual Constraints

- Use a restrained color palette and consistent typography.
- Use status badges only when they convey meaningful state.
- Prefer inline status text over separate cards for simple states.
- Keep labels concise and helper text short.
- Use cards only when grouping genuinely independent information.
- Avoid adding visual elements solely to make the interface look more sophisticated.
- Preserve accessibility, keyboard navigation, and clear focus states.

### 6. Mandatory Browser Verification

After every meaningful UI change:

1. Start the application using the existing development workflow.
2. Open the actual page in a browser.
3. Inspect the rendered layout at desktop resolution.
4. Exercise the modified interactions and validation states.
5. Check console errors and failed network requests where applicable.
6. Fix regressions before declaring completion.

Do not claim visual verification if the page was not actually inspected in a browser.

Do not run the full backend regression suite for a CSS-only or layout-only change. Run the narrowest relevant verification instead.

### 7. Scope Control

Before implementing changes, produce a short list of concrete UI problems and proposed fixes.

Prefer small, reversible changes. Do not redesign unrelated pages or add new features without a demonstrated need.

After implementation, report:
- Problems fixed.
- Files changed.
- Interactions verified.
- Remaining issues.

Success means less clutter, faster task completion, and preserved functionality—not more components or more code.
