# Accessibility Audit Summary

## Tools Used

Accessibility was reviewed using the following tools:

1. Lighthouse Accessibility Audit
   Used through Chrome DevTools.

2. axe-core
   Used through the axe DevTools browser extension.

## Pages Audited

The following pages were reviewed:

| Page      | Checked |
| --------- | ------- |
| Login     | Yes     |
| Register  | Yes     |
| Dashboard | Yes     |
| Goals     | Yes     |
| Calendar  | Yes     |
| Progress  | Yes     |
| Profile   | Yes     |

## Lighthouse Accessibility Result

Lighthouse was used through Chrome DevTools to audit the accessibility of the main application pages.

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

The results show that the application achieved consistently high accessibility scores across the main pages. The Profile page had a slightly lower score compared to the other pages, but it still remained within a strong accessibility range.

## Accessibility Improvements Made

The following improvements were implemented before running the audit:

* Added `aria-label` attributes for icon-only buttons.
* Replaced text arrows and symbols with accessible Lucide icons.
* Added semantic button elements for interactive controls.
* Added form labels for inputs in login, register, profile, goal, and task forms.
* Added visible focus styles using `:focus-visible`.
* Added skeleton loading screens instead of generic loading text.
* Added reusable ErrorState and EmptyState components.
* Improved calendar task interaction using accessible buttons.
* Improved button contrast and hover/focus states.
* Added accessible logout, edit, delete, add, and navigation buttons.

## Evidence

A screenshot of the Lighthouse accessibility result is saved at:

```txt
docs/images/lighthouse-accessibility.png
```


## axe-core Result

axe DevTools was used to check for common accessibility issues such as missing labels, insufficient contrast, invalid ARIA attributes, and keyboard navigation problems.

Result:

```txt
Critical issues: ____
Serious issues: ____
Moderate issues: ____
Minor issues: ____
```

Replace the blanks with the final axe DevTools result.

## Improvements Made

The following accessibility improvements were implemented:

### 1. Icon Button Accessibility

Icon-only buttons were updated with `aria-label` and `title` attributes.

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

### 2. Keyboard Navigation

Interactive elements were changed to use native `<button>` elements where possible. This improves keyboard support because native buttons support Enter and Space by default.

Calendar time slots also support keyboard interaction for empty slots.

### 3. Visible Focus States

Visible focus styling was added using `:focus-visible` so keyboard users can see which element is currently focused.

### 4. Skeleton Loading Screens

Generic loading text was replaced with skeleton loading screens to provide clearer loading feedback.

Skeleton screens were added for:

* Dashboard
* Goals
* Calendar
* Progress
* Profile

### 5. Form Labels

Forms were improved with proper labels for input fields.

This includes:

* Login form
* Register form
* Profile edit form
* Add goal form
* Add task form
* Edit goal form
* Edit task form

### 6. Error and Empty States

Reusable `ErrorState` and `EmptyState` components were added to provide clearer feedback when data fails to load or when no records are available.

### 7. Color Contrast

Button and text colors were adjusted to improve readability and meet WCAG contrast expectations.

### 8. Semantic HTML

Clickable `div` elements were replaced with semantic buttons where suitable. This improves screen reader support and keyboard behavior.

## Summary

The accessibility audit helped identify and fix usability issues related to labels, keyboard navigation, focus states, loading feedback, and icon-only buttons. The application is now more accessible and easier to navigate using keyboard and assistive technologies.
