# Surface Tag — Claude Instructions

## What This Is

Browser extension (Manifest V3) that auto-tags every message sent on claude.ai with device/browser metadata. The tag format is `⌁{machine}.{browser}` (e.g., `⌁g7.brave`). Claude uses this tag to detect which surface David is on and adapt behavior: response length, tool selection, formatting, and capability assumptions.

## Pre-Flight Checklist

- **Production URL:** N/A (browser extension, not web app)
- **Package Manager:** N/A (vanilla JS, no build step, no dependencies)
- **Deploy Flow:** git push to main → manual install from source (Load Unpacked in browser)
- **Repo URL:** https://github.com/duke-of-beans/surface-tag
- **Distribution:** Local install only (not published to Chrome Web Store)

## Architecture

```
surface-tag/
├── manifest.json     # MV3 manifest — permissions, content scripts, declarativeNetRequest
├── intercept.js      # MAIN world — overrides fetch, tags outgoing messages
├── bridge.js         # ISOLATED world — reads chrome.storage, relays config via postMessage
├── rules.json        # declarativeNetRequest — strips CSP from claude.ai main frame
├── popup.html        # Config UI
├── popup.js          # Config save/load
└── [canonical files]
```

**Two-world design:** Manifest V3 content scripts can't both access extension storage AND override page-level `fetch`. So we split:
- `intercept.js` (MAIN world) — runs in page JS context, overrides `fetch` before claude.ai loads
- `bridge.js` (ISOLATED world) — reads config from `chrome.storage.local`, sends to MAIN world via `postMessage`

**CSP bypass:** Claude.ai has a strict Content Security Policy that blocks MAIN world scripts from unwhitelisted extensions. `rules.json` uses `declarativeNetRequest` to strip the CSP header from claude.ai main frame responses.

## Detection Chain (consumed by Bootstrap §2)

| Surface | Signal | Source |
|---------|--------|--------|
| Desktop | KERNL/Oktyv/Filesystem in tool manifest | MCP tools |
| Web | `⌁machine.browser` at start of message | This extension |
| Phone | Neither signal present | Inference by elimination |

## Per-Machine Configuration

Install the extension on each browser. Click extension icon → set Machine + Browser → Save → reload claude.ai.

| Machine | Browser | Tag |
|---------|---------|-----|
| G7 (Dell) | Brave | `⌁g7.brave` |
| M3 (MacBook) | Firefox | `⌁m3.firefox` |

## Key Decisions

- **Tag character:** ⌁ (U+2301, ELECTRIC ARROW) — distinctive, parseable, not used in normal text
- **Fetch intercept over DOM manipulation:** format-agnostic, works regardless of claude.ai's input element type
- **CSP removal via declarativeNetRequest:** only affects main frame on claude.ai, minimal security impact
- **Triple-send timing:** bridge sends config at 0ms, 50ms, 500ms to guarantee MAIN world listener receives it
- **No build step:** vanilla JS, no bundler, no dependencies — install from source

## Troubleshooting

1. **No tag appearing:** Check console for `[Surface Tag]` logs. All 4 should fire:
   - `Intercept installed, waiting for config...`
   - `Bridge read config: {machine: "...", browserName: "..."}`
   - `Bridge sent tag: ⌁...`
   - `Config received: ⌁...`
2. **Config empty:** Click extension icon, set values, Save, reload claude.ai
3. **CSP blocking:** Verify `rules.json` is loaded — check `brave://extensions` for errors
4. **Intercept not installed:** Run in console: `window.fetch.toString().includes('_tag')`
   - Note: may return false if claude.ai re-wraps fetch, but intercept still works (check stack traces)
