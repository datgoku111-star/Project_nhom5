# Project Profile: Project_nhom5

This is a project-specific evidence snapshot created on 2026-11-15. Recheck current source and `docs/PROJECT_ANALYSIS_I18N.md` before using it; source wins when evidence conflicts.

## Confirmed Stack and Entry Points

- Application root: `project/`.
- Next.js 13.4 App Router, React 18, and TypeScript 5.
- Active i18n dependencies: `i18next` and `react-i18next`.
- Initialization: `project/src/lib/i18n.ts`.
- Provider and persistence: `project/src/components/I18nProvider.tsx`.
- Root composition: `project/src/app/layout.tsx`.
- Primary switcher: `project/src/app/(client-components)/(Header)/LangDropdown.tsx`.
- Active resources: `project/src/locales/en/common.json` and `project/src/locales/vn/common.json`.
- Tests: Vitest under `project/tests/unit` and `project/tests/integration`; Playwright under `project/tests/e2e`.

## Observed Project-Specific Risks

Revalidate rather than assuming these remain true:

- active application locales are `en` and `vn`, with `vn` as default and fallback;
- a second `en`/`vi` pathname-based implementation exists in `project/src/lib/translate.ts` and appeared to have no callers;
- root HTML is initialized with `lang="vn"` while client preference is restored from `localStorage` and mirrored to a cookie;
- at least one server page reads the language cookie and uses inline bilingual conditionals;
- the saved audit identified missing literal keys, hardcoded user-visible text, case-only key collisions, and no dedicated i18n tests.

Do not automatically normalize `vn` to `vi`: first trace resource identifiers, persistence, server consumers, formatting mappings, and compatibility impact. The standards-facing HTML language tag should be assessed separately from the internal application identifier.

## Project Conventions

- Use `@/*` for imports from `project/src`.
- Respect App Router server/client boundaries and existing `"use client"` directives.
- Keep translations in the established authoritative resources unless a migration is approved.
- Follow existing Vitest and Playwright placement and commands from `project/package.json`.
- Do not modify the separate PayOS backend unless the requested i18n behavior actually reaches its user-facing emails or responses.

## Existing Report

Read `docs/PROJECT_ANALYSIS_I18N.md` for the prior audit scope and evidence. Treat its counts and findings as dated observations requiring confirmation, not as permanent facts.

