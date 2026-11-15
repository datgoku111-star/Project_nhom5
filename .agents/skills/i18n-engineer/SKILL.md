---
name: i18n-engineer
description: Audit, design, implement, and verify internationalization in application code, including locale resources, hardcoded UI text, fallback behavior, locale state, formatting, and language switching. Use for i18n-specific analysis or changes; do not use for general frontend work, broad repository onboarding, or unrelated bug fixing.
metadata:
  short-description: Audit and improve application i18n
---

# I18n Engineer

Make internationalization behavior consistent, testable, and compatible with the application's existing architecture. Treat source code and runtime evidence as authoritative; do not infer locale contracts, translations, or framework behavior from filenames alone.

## Select the Work Mode

- **AUDIT:** inspect i18n read-only, produce evidence-backed findings, and do not edit or run project commands unless separately requested. Read [references/audit.md](references/audit.md).
- **IMPLEMENT:** fix an authorized i18n defect or deliver an approved migration. Read [references/implementation.md](references/implementation.md) and [references/testing.md](references/testing.md).
- **VERIFY:** validate existing or newly changed locale behavior. Read [references/testing.md](references/testing.md). Execution requires the same authorization and side-effect assessment as other project commands.

If the target is this repository, also read [references/project-profile.md](references/project-profile.md). Revalidate that profile against current source before relying on it because it is a dated evidence snapshot, not a permanent contract.

## Establish the Locale Contract

Before judging or changing behavior, identify from source:

- supported application locale identifiers;
- standards-facing language tags used for HTML, accessibility, URLs, headers, and metadata;
- formatting locales used by `Intl` or equivalent APIs;
- authoritative resource files, namespaces, fallback locale, and missing-key behavior;
- locale selection, persistence, server initialization, hydration, and switching flow;
- translation boundaries for UI text, API errors, database content, email, notifications, and generated documents.

Keep these identifiers distinct. An internal alias may differ from a BCP 47 tag, but the mapping must be explicit and consistently applied. Do not rename locale identifiers, routes, storage keys, or resource structure without assessing compatibility and obtaining approval when the change is consequential.

## Core Invariants

- Preserve user-selected locale across the intended navigation, reload, and authentication boundaries.
- Keep server-rendered and first client-rendered locale behavior compatible; investigate flashes or hydration mismatches with evidence.
- Maintain key parity where locale policy requires it, while accounting for dynamic keys and deliberate locale-specific content.
- Use explicit fallback behavior. Do not assume `translate(key) || fallback` works when the library returns the key on a miss.
- Keep variables, plurals, rich text, dates, numbers, currency, and relative time semantically correct for each locale.
- Do not fabricate translations. When wording requires domain or product judgment, preserve a safe existing value or request the missing decision.
- Do not translate identifiers, user content, proper names, backend codes, or database values unless the product's localization model explicitly requires it.
- Preserve accessibility attributes, layout behavior, and component contracts while extracting or replacing user-visible text.

## Work Within the Repository

- Read repository instructions, manifests, i18n entry points, representative consumers, test configuration, and relevant route boundaries.
- Follow the project's package manager, import aliases, server/client rules, naming, formatting, and test placement.
- Prefer the established i18n library and resource structure unless the user approved a migration.
- Keep changes scoped to the requested locale behavior. Do not refactor unrelated components or redesign UI as part of translation extraction.
- For resource edits, update all required locales together or explicitly report what remains untranslated.
- Review the final diff for accidental copy changes, broken interpolation, key collisions, encoding damage, and unrelated formatting churn.

## Skill Boundaries and Handoffs

This skill owns i18n-specific discovery, locale contracts, translation-resource integrity, switching behavior, formatting, and i18n verification. It does not replace general repository analysis, implementation discipline, frontend design, or independent code review.

Read [references/integrations.md](references/integrations.md) when another skill is requested or the task crosses those boundaries. Mentioning a skill does not invoke it automatically, and unavailable skills must not be assumed to exist.

## Output

For an audit, lead with prioritized findings and include the affected path, failure condition, user impact, evidence, and repair direction. Separate confirmed defects, inferences, and open questions. Use [assets/audit-report-template.md](assets/audit-report-template.md) when a persistent or structured report is requested.

For implementation or verification, report the locale behavior changed, resource files touched, commands actually run, results, and remaining unverified cases. Use [assets/test-matrix-template.md](assets/test-matrix-template.md) when a formal test matrix is useful.

