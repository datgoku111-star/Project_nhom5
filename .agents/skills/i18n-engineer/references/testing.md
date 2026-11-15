# I18n Testing

Select checks from repository evidence. Do not invent commands or claim a scenario passed without execution.

## Static and Unit Checks

Useful automated invariants include:

- every required locale resource parses;
- required locales expose the same key set or an explicit exception list;
- literal keys used in source exist in the authoritative namespace;
- case-insensitive collisions are rejected when tooling or conventions require it;
- interpolation variables match across locales;
- locale mapping returns correct BCP 47 and formatting tags;
- fallback returns an approved value and never relies on truthiness accidentally;
- plural and number/date formatting cover representative boundary values.

Dynamic keys, runtime-loaded namespaces, and framework extraction can make static results incomplete. Report those limitations.

## Component and Integration Checks

For each relevant surface verify:

- initial locale from the intended source;
- switching rerenders text and accessible names;
- loading, empty, success, validation, and error states switch too;
- locale persistence and synchronization behave as designed;
- server and client providers use compatible resources and locale identifiers;
- navigation does not reset or mix languages.

## End-to-End Matrix

At minimum consider:

1. New visitor with no saved preference.
2. Returning visitor for each supported locale.
3. Change locale, navigate, and reload.
4. Direct entry to a server-rendered route.
5. Missing-key and fallback behavior in a controlled fixture.
6. Date, number, currency, plural, and time-zone examples.
7. Mobile and desktop language controls when both exist.
8. Authenticated and anonymous layouts when locale providers differ.
9. Document `lang` and `dir`, accessible labels, page title, and metadata.

Use [../assets/test-matrix-template.md](../assets/test-matrix-template.md) for a persistent matrix.

## Regression Scope

Run focused i18n tests first, then the repository's relevant type, lint, build, and broader test commands in proportion to the change. A locale-code or routing migration warrants broader coverage than adding one translation key.

Separate failures caused by the change from pre-existing failures and environment blockers. Record command, result, and relevant output without exposing secrets.

