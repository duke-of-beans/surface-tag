# Surface Tag — Changelog

## v1.2.0 (2026-08-07)

- Added `declarativeNetRequest` to strip CSP header from claude.ai main frame
- CSP bypass allows MAIN world content script to execute
- Added diagnostic console.log lines throughout pipeline
- Bridge sends config 3x (0ms, 50ms, 500ms) for timing resilience
- Full pipeline confirmed working: tag appears in Claude conversations

## v1.1.0 (2026-08-07)

- Switched from inline script injection to `world: "MAIN"` content script
- Split into intercept.js (MAIN world) and bridge.js (ISOLATED world)
- Eliminated CSP inline-script violation
- MAIN world script still blocked by CSP allowlist (only ASURIQ whitelisted)

## v1.0.0 (2026-08-07)

- Initial build
- Single content.js with inline script injection via `document.createElement('script')`
- Blocked by claude.ai's Content Security Policy (`script-src` directive)
