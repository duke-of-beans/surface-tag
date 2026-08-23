# Surface Tag

**Surface Tag** is a lightweight browser extension (Manifest V3) that automatically prefixes every message you send on **claude.ai** with a machine‑and‑browser identifier tag.  The tag follows the format `⌁{machine}.{browser}` (e.g. `⌁g7.brave`).  Claude can read this tag to infer the surface you are using (Desktop vs Web vs Phone) and adapt its responses accordingly.

---

## Table of Contents
- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Configuration & Tag Format](#configuration--tag-format)
- [Supported Browsers](#supported-browsers)
- [Development](#development)
- [License](#license)

---

## What It Does

When you type a message on **claude.ai** and hit *Send*, Surface Tag rewrites the outgoing request so that the message body starts with a special tag:

```
⌁g7.brave   ← machine "g7" (Dell) + browser "brave"
```

Claude reads the tag and can:
- Detect that the request came from a web surface (as opposed to the native desktop client).
- Identify the exact machine and browser, enabling more tailored responses (e.g., shorter answers on a phone, richer formatting on a desktop).

If no tag is present, Claude falls back to assuming a phone surface.

---

## How It Works

Surface Tag uses a **two‑world architecture** to work around the limitations of Manifest V3 content scripts:

1. **`intercept.js` – MAIN world**
   - Injected directly into the page’s JavaScript context **before** Claude’s own scripts load.
   - Overrides the native `fetch` function, appending the tag to every outgoing request that targets `claude.ai`.
   - Listens for a configuration message from the isolated world and stores the generated tag in a closure‑scoped variable.

2. **`bridge.js` – ISOLATED world**
   - Runs as a normal content script with access to `chrome.storage.local`.
   - Reads the user‑provided `machine` and `browserName` values from extension storage.
   - Sends the full tag to the MAIN world via `window.postMessage` **three times** (at 0 ms, 50 ms, and 500 ms) to guarantee the listener in `intercept.js` receives it even if the page is still loading.

3. **CSP Bypass**
   - Claude’s site ships a strict Content‑Security‑Policy that would normally block injected scripts.
   - `rules.json` is a `declarativeNetRequest` rule that strips the `Content‑Security‑Policy` header from the main frame response of `claude.ai`.  This allows our MAIN‑world script to run without needing a host‑permission CSP override.

4. **Configuration UI**
   - `popup.html`/`popup.js` provide a tiny UI (accessible via the extension’s toolbar icon) where you can set:
     - **Machine** – an identifier you choose (e.g., `g7`, `m3`).
     - **Browser** – the browser name (`brave`, `chrome`, `firefox`, …).
   - Clicking **Save** writes the values to `chrome.storage.local` and prompts you to reload the Claude tab.

### Message Flow Diagram (simplified)

```
[Popup UI] --> chrome.storage.local (machine, browser) 
        |
        v
[bridge.js] --postMessage--> [intercept.js] --overridden fetch--> https://claude.ai/api/…
        |
        v (tag = ⌁machine.browser)
[intercept.js] adds tag to request body
```

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/duke-of-beans/surface-tag.git
   cd surface-tag
   ```
2. **Load the extension**
   - Open your browser’s extensions page (e.g., `chrome://extensions` or `brave://extensions`).
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the `surface-tag` folder.
3. **Configure**
   - Click the extension icon → set *Machine* and *Browser* → **Save**.
   - Reload any open `claude.ai` tab.
4. **Verify**
   - Open the developer console on `claude.ai` and look for logs prefixed with `[Surface Tag]`.
   - Send a test message; the request payload should start with `⌁yourMachine.yourBrowser`.

---

## Configuration & Tag Format

- **Tag format**: `⌁{machine}.{browser}`
  - The leading character is **U+2301 ELECTRIC ARROW** (⌁) – chosen because it is unlikely to appear in normal text.
  - Example tags:
    - `⌁g7.brave`
    - `⌁m3.firefox`
    - `⌁r2.chrome`
- **Setting values**
  - Open the extension popup.
  - Enter a short identifier for *Machine* (any alphanumeric string you prefer).
  - Choose the browser name from the dropdown or type a custom one.
  - Click **Save**; the extension writes the values to `chrome.storage.local` and prompts a page reload.

---

## Supported Browsers

Surface Tag works in any Chromium‑based or Firefox‑based browser that supports Manifest V3 extensions:
- Brave
- Chrome
- Edge
- Vivaldi
- Firefox (with Manifest V3 support enabled)

The extension itself does not depend on any browser‑specific APIs beyond the standard `chrome.*` namespace, so adding support for a new browser only requires that the browser implements the MV3 extension platform.

---

## Development

If you want to modify or extend Surface Tag:
1. **Make changes** to the JavaScript files (`intercept.js`, `bridge.js`, `popup.js`) or to `rules.json`.
2. **Reload** the unpacked extension from the extensions page.
3. Use the console logs (`[Surface Tag] …`) to debug the message flow.
4. When you are satisfied, commit your changes with conventional‑commit messages (e.g., `feat: add Safari support`).

The project has **no build step** and **no external dependencies** – it is pure vanilla JavaScript.

---

## License

Distributed under the **MIT License**. See the `LICENSE` file for details.
