# Surface Tag — Morning Briefing

**Session:** 2026-08-07
**Surface:** Web (G7/Brave — first confirmed use of Surface Tag itself)

## What Happened

Built Surface Tag from concept to working v1.2 in a single session. Three iterations to solve CSP enforcement on claude.ai:
1. v1.0: Inline script injection → blocked by CSP
2. v1.1: MAIN world content script → blocked by CSP allowlist (only ASURIQ whitelisted)
3. v1.2: declarativeNetRequest strips CSP → MAIN world script executes → pipeline works

Bootstrap v9.4.0-M drafted with §2 SURFACE_DETECTION (decoder ring + behavioral adaptation rules).

## What's Next

- David pastes Bootstrap v9.4.0-M into Settings → Profile
- Install on M3 browsers when needed
- Clone repo to D:\Dev\surface-tag from Desktop session
- Strip diagnostic logs after stability confirmed
