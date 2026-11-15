# I18n Implementation

Use only when the user has authorized source changes. An audit request alone does not authorize fixes.

## Define the Change

Establish acceptance criteria in observable terms, for example:

- switching to each supported locale updates the specified surfaces;
- the selection survives the intended reload or navigation boundary;
- no raw key appears when a translation is absent;
- server HTML and hydrated UI agree on language;
- required resource files contain matching semantic keys;
- dates, currency, and plurals follow the selected locale.

Identify compatibility constraints before changing locale codes, URL schemes, storage keys, cookies, namespaces, or public APIs.

## Repair Strategy

Choose the smallest strategy supported by evidence:

- add missing keys to every required locale;
- replace hardcoded user-facing text with semantic keys;
- centralize the application-locale to standards/formatting-locale mapping;
- make fallback explicit through the library's supported API;
- align provider, server initialization, persistence, and switcher state;
- remove a legacy path only after confirming it has no callers or runtime consumers;
- introduce a localization model for dynamic data only when product requirements define who authors and owns each translation.

Do not combine locale migration, key renaming, translation rewriting, and broad component refactoring unless they are all necessary and approved. For large migrations, preserve compatibility incrementally or provide a bounded mapping layer.

## Translation Resources

- Prefer stable semantic keys over source-language sentences when that matches repository convention.
- Preserve interpolation variable names and types across locales.
- Use the library's plural and context mechanisms rather than manual string concatenation.
- Keep punctuation and embedded markup intentional; do not copy HTML into translations without a supported rich-text mechanism.
- Avoid bulk machine translation unless the user requests it and accepts review requirements.
- When a translation is unknown, do not invent domain wording. Record the gap or use an approved fallback.

## Hardcoded Text

Extract only user-visible text in scope. Inspect nearby loading, empty, error, confirmation, placeholder, `alt`, `title`, and accessibility states so the component does not remain partially localized.

Keep developer logs, protocol values, enum codes, and identifiers unchanged unless the UI layer exposes them directly. Map backend codes to localized UI messages instead of translating backend contracts in place.

## Locale State

Define one source of truth and explicit adapters for:

- route or domain locale;
- server request locale;
- client i18n instance;
- persisted preference;
- HTML language/direction;
- formatting locale.

Avoid effects that overwrite a newer user selection, duplicate event listeners, or create a server/client first-render mismatch. Assess cache behavior when locale affects server output.

## Completion

Review resource parity, callers, first render, switch behavior, formatting, accessibility, and the final diff. Run the relevant checks from [testing.md](testing.md) and disclose anything not verified.

