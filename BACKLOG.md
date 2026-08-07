# Surface Tag — Backlog

## P2 — Medium

- [ ] Install on M3/Firefox
- [ ] Install on M3/Chrome (if used for claude.ai)
- [ ] Strip diagnostic console.log lines once stable for 1 week
- [ ] Update README.md with final architecture (post-CSP-bypass)

## P3 — Low

- [ ] Add extension icon (16x16, 48x48, 128x128)
- [ ] Firefox permanent install (currently temporary add-on — removed on restart)
- [ ] Consider Chrome Web Store listing for easier install across machines

## Done

- [x] v1.0 — Initial build: inline script injection approach (2026-08-07)
- [x] v1.0 → v1.1 — CSP blocked inline scripts; switched to `world: "MAIN"` content scripts (2026-08-07)
- [x] v1.1 → v1.2 — MAIN world scripts still blocked by CSP allowlist; added `declarativeNetRequest` to strip CSP (2026-08-07)
- [x] v1.2 — Config wasn't persisting; re-saved after extension reload (2026-08-07)
- [x] v1.2 — Full pipeline confirmed working: tag visible in Claude conversation (2026-08-07)
- [x] Bootstrap v9.4.0-M — §2 SURFACE_DETECTION drafted with decoder ring + adaptation rules (2026-08-07)
