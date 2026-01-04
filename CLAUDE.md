# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Unsaid** is a privacy-focused AI articulation assistant with zero-knowledge encryption. Users write drafts that are encrypted client-side before storage, ensuring the server never sees plaintext content.

## Commands

### Frontend (SvelteKit)

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm check            # TypeScript + Svelte type checking
pnpm lint             # Prettier + ESLint
pnpm format           # Format code with Prettier
pnpm test             # Run all tests once
pnpm test:unit        # Run Vitest in watch mode
```

### E2E Testing (Playwright)

```bash
pnpm test:e2e         # Run all E2E tests
pnpm test:e2e:chrome  # Chrome only
pnpm test:e2e:firefox # Firefox only
pnpm test:e2e:safari  # Safari only
pnpm test:e2e:mobile  # Mobile browsers only
pnpm test:e2e:headed  # Run with visible browser
pnpm test:e2e:debug   # Debug mode with Playwright inspector
pnpm test:e2e:report  # View test report
```

### Performance & Accessibility Audits

```bash
npx tsx scripts/a11y-audit.ts     # Run accessibility audit (axe-core)
bash scripts/lighthouse-audit.sh  # Run Lighthouse performance audit
```

### Backend (FastAPI)

```bash
cd backend
uv sync                              # Install dependencies
uvicorn app.main:app --reload        # Start API server (port 8000)
ruff check .                         # Lint Python code
pytest                               # Run tests
```

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5 with runes), TypeScript, Tailwind CSS v4 + DaisyUI v5
- **Backend**: FastAPI (Python 3.11+), Pydantic, OpenRouter API
- **Database**: Supabase (PostgreSQL + Auth via `@supabase/ssr`)
- **Encryption**: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- **Testing**: Vitest (dual client/server projects), Playwright E2E, pytest

## Architecture

### Zero-Knowledge Encryption

The core security feature. All draft content is encrypted in the browser before transmission:

1. **Key Derivation** (`src/lib/services/keyDerivationService.ts`): PBKDF2 derives a key from user password + salt (stored in `user_salts` table)
2. **Cipher** (`src/lib/crypto/cipher.ts`): AES-256-GCM with unique 96-bit IV per draft
3. **Key Storage** (`src/lib/crypto/keyStore.ts`): Keys exist only in memory, never persisted

The derived key is created on login and cleared on logout. If a user refreshes with a valid session but no key, the app prompts for password re-entry.

### Route Structure

Uses SvelteKit route groups for access control:

- `src/routes/(auth)/` — Public auth pages (login, signup, forgot-password, reset-password)
- `src/routes/(app)/` — Protected routes requiring authentication (write, history, settings, prompts, patterns)

Layout files handle redirects:

- `(auth)/+layout.server.ts` redirects authenticated users to `/write`
- `(app)/+layout.server.ts` redirects unauthenticated users to `/login`

### Service Layer

All business logic lives in `src/lib/services/`:

- `draftService.ts` — CRUD for drafts, calls encryption service automatically
- `encryptionService.ts` — Encrypts/decrypts draft content and metadata
- `keyDerivationService.ts` — PBKDF2 key derivation from password
- `saltService.ts` — Manages per-user salts in database
- `ai.ts` — AI suggestions with exponential backoff retry, timeout, cancellation

All services follow the `{ data, error }` result pattern - they never throw exceptions.

### State Management (Svelte 5 Runes)

Stores in `src/lib/stores/` use Svelte 5 runes (`$state`, `$derived`):

- `draft.svelte.ts` — Current draft content, metadata, dirty state
- `ai.svelte.ts` — AI request states, suggestions, active modes
- `auth.svelte.ts` — User session state
- `crypto.svelte.ts` — Encryption key availability

### Backend Structure

```
backend/app/
├── main.py              # FastAPI app entry
├── routers/ai.py        # AI endpoints
├── services/openrouter.py # OpenRouter API integration
├── models/ai.py         # Pydantic models
├── prompts/base.py      # System prompts
└── middleware/          # Auth and rate limiting
```

## Testing

### Unit Tests (Vitest)

Vitest runs two project configurations (`vite.config.ts`):

- **client**: Browser tests via Playwright for `*.svelte.test.ts` files
- **server**: Node environment for standard `*.test.ts` files

Run a specific test file:

```bash
pnpm test:unit src/lib/services/encryptionService.svelte.test.ts
```

### E2E Tests (Playwright)

E2E tests live in `e2e/tests/` and cover critical user flows:

- `auth-flow.spec.ts` — Login, logout, session persistence, form validation
- `encryption-flow.spec.ts` — Draft encryption, key persistence, edge cases
- `sync-flow.spec.ts` — Autosave, sync indicator, content persistence

Configuration: `e2e/playwright.config.ts`
Test utilities: `e2e/utils/test-helpers.ts`

### Edge Case Tests

Encryption edge cases are tested in `src/lib/crypto/cipher.edge-cases.svelte.test.ts`:

- Empty strings, unicode characters, IV uniqueness, tampering detection

## Database Tables

- `drafts` — Encrypted user content (`encrypted_content`, `encrypted_metadata`, `iv`, `deleted_at`)
- `user_salts` — Per-user encryption salts (`user_id`, `salt`)
- `auth.users` — Managed by Supabase Auth

## Key Patterns

### Supabase SSR

- Server client in `src/lib/server/supabase.ts`
- Browser client in `src/lib/services/supabase.ts`

### Component Organization

- Reusable UI in `src/lib/components/ui/` (Button, Input, etc.)
- Domain components in `src/lib/components/draft/`
- All UI components support accessibility (ARIA attributes, focus management)

### AI Modes

- `tone` — Tone Check
- `expand` — Expand Thought
- `clarify` — Rewrite
- `alternatives` — Alternative phrasings
- `opening` — Opening suggestions

### Accessibility

The app follows WCAG 2.1 AA guidelines:

- Skip links for keyboard navigation (`src/routes/+layout.svelte`)
- ARIA attributes on all interactive components
- Focus management in modals and drawers
- Screen reader announcements for dynamic content
- Minimum 44x44px touch targets on mobile

### Mobile Responsiveness

- Responsive utilities in `src/lib/utils/responsive.ts`
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Mobile drawer for AI suggestions on small screens
- Touch-friendly tap targets (56px FAB button)

### Error Handling Pattern

All services return `{ data, error }` objects instead of throwing:

```typescript
const { draft, error } = await draftService.saveDraft(data);
if (error) {
	showError(error);
	return;
}
// Use draft safely
```

### Soft Delete Pattern

Drafts support soft deletion (trash):

```typescript
await draftService.softDeleteDraft(id); // Move to trash
await draftService.restoreDraft(id); // Restore from trash
await draftService.permanentlyDeleteDraft(id); // Hard delete
```

## Documentation

### Service Documentation

All services have comprehensive JSDoc comments with:

- Module-level architecture documentation
- Function-level parameter and return type documentation
- Usage examples
- Security notes where applicable

### Audit Scripts

- `scripts/a11y-audit.ts` — Playwright + axe-core accessibility audits
- `scripts/lighthouse-audit.sh` — Performance, SEO, best practices audits
- `docs/mobile-audit-checklist.md` — Manual mobile responsiveness checklist
