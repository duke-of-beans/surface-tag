/**
 * Surface Tag — bridge.js (v1.2)
 * ISOLATED world, document_start.
 * Reads config from extension storage, relays to MAIN world via postMessage.
 * Sends immediately + delayed to handle MAIN world timing.
 */

(async () => {
  var api = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;

  try {
    var config = await api.storage.local.get(['machine', 'browserName']);
    var machine = (config.machine || '').trim();
    var browserName = (config.browserName || '').trim();

    console.log('[Surface Tag] Bridge read config:', { machine, browserName });

    if (!machine && !browserName) {
      console.log('[Surface Tag] No config set — open extension popup to configure');
      return;
    }

    var tag = '\u2301' + (machine || '??') + '.' + (browserName || '??');

    // Send immediately
    window.postMessage({ type: '__SURFACE_TAG', tag: tag }, '*');

    // Send again after short delay (in case MAIN world listener isn't ready yet)
    setTimeout(function() {
      window.postMessage({ type: '__SURFACE_TAG', tag: tag }, '*');
    }, 50);

    // Send once more after page scripts have loaded
    setTimeout(function() {
      window.postMessage({ type: '__SURFACE_TAG', tag: tag }, '*');
    }, 500);

    console.log('[Surface Tag] Bridge sent tag:', tag);
  } catch(e) {
    console.warn('[Surface Tag] Bridge error:', e);
  }
})();
