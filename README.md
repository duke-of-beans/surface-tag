# Surface Tag

Browser extension that auto-tags every message sent on claude.ai with device/browser metadata, so Claude knows which surface you're on.

**Tag format:** `⌁{machine}.{browser}` — e.g. `⌁g7.brave`, `⌁m3.firefox`

## How It Works

1. Installs as a Manifest V3 browser extension (Chrome, Brave, Edge, Firefox)
2. At page load, overrides `fetch` on claude.ai before the app's JS runs
3. When you send a message, intercepts the API request and prepends your surface tag
4. You configure machine name + browser name once per browser install

## Surface Coverage

| Surface | How Claude identifies it |
|---------|------------------------|
| Desktop app (G7) | KERNL MCP tools present in context |
| Web browser | **This extension** — `⌁machine.browser` tag |
| Mobile app | No KERNL + no tag = phone (inferred) |

## Install

### Brave / Chrome / Edge (Chromium)

1. Open `brave://extensions` (or `chrome://extensions` or `edge://extensions`)
2. Enable **Developer mode** (toggle, top right)
3. Click **Load unpacked**
4. Select this `surface-tag` folder
5. Click the extension icon in the toolbar → set Machine and Browser → Save
6. Reload claude.ai

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from this folder
4. Click the extension icon → configure → Save
5. Reload claude.ai

> Firefox temporary add-ons are removed on browser restart.
> For persistent install, package as .xpi or use `web-ext` tooling.

## Per-Machine Config

Install the extension on each browser and set:

| Machine | Browser | Tag |
|---------|---------|-----|
| G7 (Dell) | Brave | `⌁g7.brave` |
| M3 (MacBook) | Firefox | `⌁m3.firefox` |
| M3 (MacBook) | Chrome | `⌁m3.chrome` |

## Files

```
surface-tag/
├── manifest.json   # Extension manifest (MV3)
├── content.js      # Fetch interceptor + config relay
├── popup.html      # Config UI
├── popup.js        # Config save/load
└── README.md
```

## Notes

- The tag is prepended to the message text, so Claude sees it as part of the message
- Tags are ~5 characters / 2-3 tokens — negligible impact on context
- If config is empty (not yet set), no tag is added — silent no-op
- Duplicate prevention: won't add tag if message already starts with one
- Only intercepts POST requests with JSON string bodies — safe passthrough for everything else
