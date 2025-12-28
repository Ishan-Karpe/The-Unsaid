# Mobile Responsiveness Audit Checklist

## Viewport Sizes to Test

| Device           | Width  | Description                 |
| ---------------- | ------ | --------------------------- |
| Mobile Small     | 320px  | iPhone SE, older Android    |
| Mobile Medium    | 375px  | iPhone X, modern Android    |
| Mobile Large     | 414px  | iPhone Plus, larger Android |
| Tablet Portrait  | 768px  | iPad, Android tablets       |
| Tablet Landscape | 1024px | iPad landscape              |

## Testing Instructions

1. Open Chrome DevTools (F12 or Cmd+Opt+I)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select each viewport size and test the following

---

## Pages to Audit

### Landing Page (`/`)

- [ ] Hero section stacks vertically on mobile
- [ ] CTA buttons are appropriately sized (min 44px touch target)
- [ ] Feature cards stack in single column on mobile
- [ ] Navigation hamburger menu works (if applicable)
- [ ] Footer links wrap properly
- [ ] No horizontal scroll at any viewport
- [ ] Text is readable without zooming (min 16px body text)
- [ ] Images scale and don't overflow
- [ ] Adequate spacing between interactive elements

### Login Page (`/login`)

- [ ] Form is centered and readable
- [ ] Input fields are appropriately sized (min height 44px)
- [ ] Input fields use correct mobile types (email, password)
- [ ] Password visibility toggle is accessible (44x44px min)
- [ ] Error messages are visible and don't overflow
- [ ] "Forgot password" link is tappable
- [ ] "Sign up" link has adequate spacing
- [ ] Form doesn't zoom on input focus (font-size >= 16px)
- [ ] Keyboard doesn't obscure submit button

### Signup Page (`/signup`)

- [ ] All form fields visible and usable
- [ ] Password strength indicator visible on mobile
- [ ] Password confirmation field accessible
- [ ] Terms/consent checkboxes tappable
- [ ] Submit button visible with keyboard open

### Forgot Password (`/forgot-password`)

- [ ] Form is centered and accessible
- [ ] Email input has proper mobile keyboard
- [ ] Success/error messages visible

### Write Page (`/write`)

- [ ] Editor textarea takes full width
- [ ] Editor has adequate height on mobile
- [ ] Sidebar is hidden on mobile (< 1024px)
- [ ] Mobile drawer/FAB for context panel works
- [ ] AI suggestion panel adapts (modal or slide-up)
- [ ] Keyboard doesn't obscure editor excessively
- [ ] Save status visible on mobile
- [ ] Character/word count visible
- [ ] Bottom action bar doesn't overlap content
- [ ] Prompts section accessible via mobile UI

### History Page (`/history`)

- [ ] Draft cards stack vertically
- [ ] Draft preview text doesn't overflow
- [ ] Search bar is usable on mobile
- [ ] Filter panel accessible (drawer or collapsible)
- [ ] Date pickers use native mobile pickers
- [ ] Action buttons (edit/delete) have 44px+ touch targets
- [ ] Load more / pagination buttons centered
- [ ] Trash modal/view is usable on mobile
- [ ] Empty state message centered and readable

### Settings Page (`/settings`)

- [ ] Settings groups stack vertically
- [ ] Toggle switches have 44px+ touch targets
- [ ] Sign out button prominent and accessible
- [ ] Theme toggle works on mobile
- [ ] All settings readable and tappable

### Prompts Page (`/prompts`)

- [ ] Category tabs scrollable or wrap
- [ ] Prompt cards readable on mobile
- [ ] Copy/select prompts tappable

### Patterns Page (`/patterns`)

- [ ] Insight cards stack vertically
- [ ] Charts/graphs scale appropriately
- [ ] Data visualizations usable on small screens

---

## Common Issues to Check

### Touch Targets

- [ ] All interactive elements >= 44x44px
- [ ] Adequate spacing between clickable items (8px min)
- [ ] Links have sufficient padding for touch

### Typography

- [ ] Body text minimum 16px
- [ ] Input font-size >= 16px (prevents iOS zoom)
- [ ] Headings scale appropriately
- [ ] Line height adequate for readability (1.4+)

### Spacing

- [ ] Adequate padding on container edges
- [ ] Content doesn't touch screen edges
- [ ] Safe area insets considered for notched devices

### Forms

- [ ] Correct input types (email, tel, password, etc.)
- [ ] Labels visible and associated
- [ ] Error states visible next to inputs
- [ ] Autocomplete attributes present

### Media

- [ ] Images have max-width: 100%
- [ ] SVGs scale properly
- [ ] No fixed-width elements causing overflow

### Navigation

- [ ] Mobile navigation accessible
- [ ] Back buttons present where needed
- [ ] Bottom navigation doesn't overlap content

### Modals & Dialogs

- [ ] Modals are full-screen or properly sized on mobile
- [ ] Close buttons accessible (44x44px)
- [ ] Scrollable content scrolls within modal
- [ ] Backdrop dismissal works

---

## Performance on Mobile

- [ ] Initial load under 3 seconds on 3G
- [ ] Interactions feel responsive
- [ ] No layout shifts during load
- [ ] Images optimized for mobile

---

## Browser-Specific Testing

### iOS Safari

- [ ] 100vh works correctly (accounts for address bar)
- [ ] Bottom safe area handled
- [ ] No rubber-banding issues on fixed elements

### Android Chrome

- [ ] Android-specific keyboard behavior
- [ ] Pull-to-refresh doesn't interfere

---

## Automated Testing

Run mobile E2E tests:

```bash
pnpm test:e2e:mobile
```

This runs Playwright tests on:

- Pixel 5 (Mobile Chrome)
- iPhone 12 (Mobile Safari)

---

## Issue Tracking

| Page | Issue | Severity | Status |
| ---- | ----- | -------- | ------ |
|      |       |          |        |

**Severity Levels:**

- 🔴 Critical: Blocks usage
- 🟠 Major: Significantly impacts UX
- 🟡 Minor: Cosmetic or minor inconvenience
- 🟢 Enhancement: Nice to have improvement
