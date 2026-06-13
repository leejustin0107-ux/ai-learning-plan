# Accessibility Audit Summary

## Tools Used

Accessibility was audited using the following tools:

1. **Lighthouse Accessibility Audit**
   Used through Chrome DevTools to measure accessibility scores for the main application pages.

2. **axe DevTools / axe-core**
   Used through the axe DevTools browser extension to detect accessibility issues such as missing labels, low color contrast, invalid ARIA usage, and keyboard accessibility problems.

## Pages Audited

The audit was performed on the main application pages:

* Login
* Register
* Dashboard
* Goals
* Calendar
* Progress Snapshot
* Profile

---

## Lighthouse Accessibility Results

Lighthouse was run using Chrome DevTools with the Accessibility category enabled.

| Page              | Lighthouse Accessibility Score |
| ----------------- | -----------------------------: |
| Login             |                       98 / 100 |
| Register          |                       98 / 100 |
| Dashboard         |                       98 / 100 |
| Goals             |                       98 / 100 |
| Calendar          |                       98 / 100 |
| Progress Snapshot |                       98 / 100 |
| Profile           |                       95 / 100 |

Average Lighthouse Accessibility Score:

```txt
97.6 / 100
```

The Lighthouse results show that the application achieved consistently high accessibility scores across all audited pages.

---

## axe DevTools / axe-core Results

axe DevTools was used to scan the same pages for accessibility issues. After fixes were applied, all audited pages showed zero detected issues.

| Page              | Critical | Serious | Moderate | Minor |
| ----------------- | -------: | ------: | -------: | ----: |
| Login             |        0 |       0 |        0 |     0 |
| Register          |        0 |       0 |        0 |     0 |
| Dashboard         |        0 |       0 |        0 |     0 |
| Goals             |        0 |       0 |        0 |     0 |
| Calendar          |        0 |       0 |        0 |     0 |
| Progress Snapshot |        0 |       0 |        0 |     0 |
| Profile           |        0 |       0 |        0 |     0 |

The Profile page initially had serious color contrast issues. These were fixed by darkening muted text, disabled input text, and availability status badge colors. After the contrast fixes, axe reported zero issues on the Profile page.

---

## Accessibility Improvements Made

The following accessibility improvements were implemented:

### 1. Icon Button Accessibility

Icon-only buttons were updated with accessible labels using `aria-label` and `title`.

Examples include:

* Add task button
* Edit goal button
* Edit task button
* Delete goal button
* Delete task button
* Show and hide task buttons
* Calendar previous and next week buttons
* Progress previous and next week buttons
* Logout button

### 2. Semantic Interactive Elements

Clickable elements were changed to semantic `<button>` elements where appropriate. This improves keyboard support because native buttons support Enter and Space by default.

### 3. Keyboard Navigation

Keyboard support was improved for interactive controls, including task buttons, calendar navigation, and form actions.

### 4. Visible Focus States

Visible focus styling was added using `:focus-visible` so keyboard users can clearly see the focused element.

### 5. Form Labels

Form fields were improved with proper labels. This includes forms for:

* Login
* Register
* Profile editing
* Goal creation
* Goal editing
* Task creation
* Task editing

### 6. Loading Feedback

Generic loading text was replaced with skeleton loading screens to provide clearer loading feedback.

Skeleton screens were added for:

* Dashboard
* Goals
* Calendar
* Progress
* Profile

### 7. Error and Empty States

Reusable `ErrorState` and `EmptyState` components were added to improve feedback when data fails to load or when no data exists.

### 8. Color Contrast Fixes

Color contrast was improved across the interface. The Profile page received additional contrast fixes after axe identified serious contrast issues.

Fixes included:

* Darkening muted gray text.
* Increasing contrast for availability status badges.
* Improving disabled input text contrast.
* Improving secondary button contrast.
* Improving modal close button contrast.

### 9. Calendar Accessibility

Calendar tasks were made interactive using accessible buttons. Calendar navigation buttons were updated with accessible icon buttons and labels.

### 10. Drag-and-Drop Support

Calendar task drag-and-drop was added for mouse users while keeping task controls accessible through buttons and existing task editing features.

---

## Evidence

Screenshot evidence should be saved in the documentation folder:

```txt
docs/screenshots/lighthouse-accessibility.png
docs/screenshots/axe-accessibility.png
```


---

## Summary

The accessibility audit confirmed that the application meets a strong accessibility standard. Lighthouse reported high accessibility scores across all main pages, with an average score of 97.6 out of 100. axe DevTools reported zero critical, serious, moderate, or minor issues after fixes were applied. The main improvements focused on accessible labels, semantic buttons, keyboard support, focus states, skeleton loading, error handling, and color contrast.
