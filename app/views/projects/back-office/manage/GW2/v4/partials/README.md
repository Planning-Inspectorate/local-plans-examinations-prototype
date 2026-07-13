# GW2 v4 Partials Guide

This guide defines how to create and maintain partials in this folder.

## Purpose

Use partials to keep page templates readable and reduce duplication.

In this feature, the main composition page is:
- `app/views/projects/back-office/manage/GW2/v4/gateway-2.html`

Each partial should represent one clear section of that page.

## Naming Rules

- Prefix partial filenames with `_`.
- Use kebab-case names that describe the section.
- Keep each partial focused on one section.

Examples:
- `_gateway-summary.njk`
- `_workshop-details.njk`
- `_workshop-documents.njk`

## What Goes Where

Route file responsibility (`_routes.js`):
- Build the view model.
- Compute booleans for display decisions.
- Format values for display (for example, date strings).

Partial responsibility (`.njk`):
- Render HTML for one section.
- Use simple conditionals only.
- Avoid heavy data transformation.

Parent page responsibility (`gateway-2.html`):
- Compose sections in display order using includes.

## Data Contract Pattern

Each partial should have an explicit expected input contract.

Example contracts used in this folder:
- `_workshop-documents.njk`
  - expects `uploadedDocuments`
  - expects `pageState.hasWorkshopDocuments`
- `_workshop-details.njk`
  - expects `hearings`

Rule: If you need a new display field, add it in the route first, then consume it in the partial.

## Styling Guidance

- Prefer shared GOV.UK classes.
- Keep styles out of partials where possible.
- If local styles are unavoidable, keep them minimal and scoped.

## Forms and Actions

- Do not wrap display-only sections in `<form>`.
- Place form tags only around fields/buttons that submit.
- Keep action links (`Change`, `View`, `Upload`) inside the section they belong to.

## Safe Refactor Workflow

1. Copy one section from the parent template into a new partial.
2. Replace the original block with an include.
3. Verify required data is provided by the route view model.
4. Run template error checks.
5. Test both empty and populated states.

## Review Checklist

Before merging changes to partials, check:

- Partial has one clear purpose.
- File name matches section purpose.
- Route prepares all display-ready values.
- No duplicate logic across multiple partials.
- No unnecessary nested forms.
- Empty-state rendering exists where needed.
- Gateway page still reads as clean composition.

## Include Example

```njk
{% include "projects/back-office/manage/GW2/v4/partials/_workshop-details.njk" %}
```

## When Not To Create a Partial

Avoid creating a new partial when:
- The block is tiny and only used once.
- Extraction would make navigation harder than the current inline block.
- The section is still highly experimental and changing every few minutes.

Refactor to partials once structure stabilizes.
