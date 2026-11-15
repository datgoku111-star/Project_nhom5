# I18n Test Matrix

| ID | Surface | Initial locale source | Action | Expected result | Level | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I18N-01 | First visit | Default/negotiated | Open direct URL | Correct server and client language | E2E | Not run |  |
| I18N-02 | Language switcher | Current locale | Switch locale | Text and accessible names update | Component/E2E | Not run |  |
| I18N-03 | Persistence | Saved preference | Reload and navigate | Locale remains selected | E2E | Not run |  |
| I18N-04 | Resources | Locale files | Run parity check | Required keys and variables match | Unit/static | Not run |  |
| I18N-05 | Fallback | Missing-key fixture | Render missing key | Approved fallback, no raw key | Unit/integration | Not run |  |
| I18N-06 | Formatting | Selected locale | Render date/number/currency | Locale-correct formatting | Unit/E2E | Not run |  |
| I18N-07 | Accessibility | Selected locale | Inspect document and controls | Correct `lang`, `dir`, labels | E2E/manual | Not run |  |
| I18N-08 | Auth boundary | Saved preference | Sign in/out | Locale behavior matches contract | E2E | Not run |  |

Add or remove rows according to actual supported behavior. Do not mark a row passed without observed evidence.
