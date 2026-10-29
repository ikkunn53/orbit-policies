# Orbit public policies

Static, bilingual policy pages for the privately operated Discord analytics service.
This repository must contain policy content only: no application source, credentials,
databases, analytics exports, or screenshots of real users.

## Build

Requires Node.js 24 or later, with no npm dependencies.

1. Set the public operator name and an actual support email or HTTPS contact URL in
   `site-config.json`.
2. Confirm the policy matches actual operation, including consent, retention and
   manual deletion handling.
3. Run `node build.mjs`. It refuses production builds without a contact destination.

`node build.mjs --draft` creates a visibly marked, noindex local review draft. Do
not publish draft output.

## GitHub Pages

Publish only files inside `dist/`, not the private analytics application. For a
standalone public repository, copy `dist/*` into the root of a publishing branch,
then select that branch and `/ (root)` in Settings → Pages → Deploy from a branch.
Keep this source on `main` and use a separate `gh-pages` branch for output.

After publishing, register the HTTPS `/privacy/` and `/terms/` URLs in the Discord
Developer Portal, and use `/contact/` for support and deletion requests.
`/en/privacy/`, `/en/terms/` and `/en/contact/` provide equivalent English pages.

Publishing a policy is not Discord approval. Discord verification and privileged
intent applications must be submitted separately in the Developer Portal.
