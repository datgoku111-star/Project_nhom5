# Skill Integrations

Use integrations only when the task actually crosses a boundary and the named skill is available. Skills remain independent; do not invoke one merely because it is mentioned here.

## `project-analyzer`

Use for broad onboarding or architecture discovery in an unfamiliar repository. `i18n-engineer` should still perform its own targeted locale tracing. Do not duplicate a repository-wide report when manifests, entry points, and conventions are already established.

## `bug-fix`

If available and explicitly applicable, let it own reproduction, root-cause discipline, bounded implementation, and regression handling for a reported defect. `i18n-engineer` supplies the locale contract, i18n-specific failure modes, resource checks, and language-switch verification.

No `bug-fix` skill was found in the known skill roots when this skill was created. Do not assume it is installed; use an available implementation workflow or proceed within the user's authorized scope.

## `frontend-skill`

If available and explicitly applicable, let it own general component composition, visual behavior, responsive layout, and frontend accessibility patterns. `i18n-engineer` owns translated content boundaries, document language/direction, locale state, formatting, and cross-locale UI verification.

No `frontend-skill` skill was found in the known skill roots when this skill was created. Do not invent its interface or requirements.

## `dev-workflow`

This is the currently available general implementation workflow nearest to `bug-fix`. Use it when the user requests i18n source changes that require normal feature/bug-fix implementation discipline. `i18n-engineer` remains the domain guide; `dev-workflow` does not replace locale-specific acceptance criteria.

## `code-review`

Use for an independent review of an i18n diff when the user requests review. Provide the locale contract and acceptance criteria as review context. Keep review read-only unless fixes are separately authorized.

## Handoff Information

Pass only what the receiving workflow needs:

- supported locale identifiers and mappings;
- authoritative resources and namespaces;
- reproduction steps or target behavior;
- affected server/client boundaries;
- fallback and persistence expectations;
- verification commands discovered from the repository;
- unresolved product-language decisions.

