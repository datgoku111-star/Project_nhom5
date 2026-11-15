# I18n Audit

Use this reference for read-only assessment. Match depth to the requested scope; do not force a repository-wide audit for one component.

## Discover the System

1. Locate manifests and identify the framework, router, rendering model, i18n packages, formatting libraries, and test tools.
2. Locate initialization, providers, middleware, route locale handling, resource loaders, locale selectors, and persistence mechanisms.
3. Enumerate resource formats, locales, namespaces, fallback configuration, and generation or synchronization tooling.
4. Trace one representative language change from user action through state, persistence, rerender, navigation, server requests, and reload.
5. Trace server-rendered locale selection separately from client initialization.

Record conflicting implementations rather than choosing one silently.

## Static Checks

Check where applicable:

- locale sets and key parity across authoritative resources;
- duplicate keys and case-insensitive collisions;
- malformed resources, encoding problems, and inconsistent nesting;
- literal translation calls whose keys do not exist;
- dynamic key construction that prevents complete static proof;
- unused or legacy translation systems, confirmed by imports and routing evidence;
- user-visible hardcoded text in components, validation, alerts, errors, emails, notifications, metadata, and empty/loading states;
- interpolation variables, plural forms, rich-text placeholders, and unsafe HTML;
- `Intl` or library formatting for dates, time zones, numbers, currency, and relative time;
- accessibility text and document language tags;
- API or database messages shown directly to users;
- dynamic content whose schema has no localization model.

Do not classify every literal as a defect. Exclude or separately label logs, test fixtures, identifiers, status codes, developer diagnostics, proper names, and user-generated content unless they are actually presented as localized UI.

## Runtime Risks to Identify

- wrong-language first paint or hydration mismatch;
- server/client locale disagreement;
- switching updates only part of the UI;
- selection lost on reload, navigation, tab synchronization, or sign-in/out;
- fallback exposes raw keys or silently shows the wrong language;
- URLs, metadata, cookies, or caches remain stale after switching;
- directionality or layout failure for supported scripts;
- localized formatting that changes parsing or business values.

Static evidence may indicate these risks but does not prove runtime behavior. Label unexecuted scenarios as requiring verification.

## Prioritize Findings

- **High:** raw keys, incorrect language, broken switching, hydration failure, inaccessible language metadata, corrupted interpolation, or business-critical mistranslation.
- **Medium:** inconsistent locale contracts, partial coverage, legacy systems, dynamic content gaps, or fallback that masks missing resources.
- **Low:** key hygiene, dead resources, naming drift, or missing automation without a current user-visible failure.

For each finding state: location, trigger, observed or inferred behavior, impact, evidence, and the smallest safe repair direction.

