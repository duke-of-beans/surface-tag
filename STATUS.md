**Status:** active
**Phase:** v1.2 — production
**Last Sprint:** 2026-08-07
**Last Updated:** 2026-08-07

## Current State

Surface Tag v1.2 is live and operational on G7/Brave. The full pipeline works:
intercept.js (MAIN world fetch override) → bridge.js (ISOLATED world config relay) → CSP bypass via declarativeNetRequest.

Bootstrap v9.4.0-M includes §2 SURFACE_DETECTION which consumes the tag.

## Installed On

- [x] G7 — Brave (⌁g7.brave)
- [ ] M3 — Firefox (⌁m3.firefox)
- [ ] M3 — Chrome (⌁m3.chrome)
