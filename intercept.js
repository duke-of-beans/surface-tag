/**
 * Surface Tag — intercept.js (v1.2)
 * MAIN world, document_start.
 * Overrides fetch, tags outgoing user messages.
 */

(function() {
  'use strict';

  var _fetch = window.fetch;
  var _tag = null;

  window.addEventListener('message', function(e) {
    if (e.source === window && e.data && e.data.type === '__SURFACE_TAG') {
      _tag = e.data.tag;
      console.log('[Surface Tag] Config received:', _tag);
    }
  });

  console.log('[Surface Tag] Intercept installed, waiting for config...');

  window.fetch = function(input, init) {
    // Normalize: handle Request objects and missing init
    var method = (init && init.method) ? init.method : 'GET';
    var body = (init && init.body) ? init.body : null;

    if (!_tag || method.toUpperCase() !== 'POST' || typeof body !== 'string') {
      return _fetch.apply(this, arguments);
    }

    try {
      var parsed = JSON.parse(body);
      var tagged = false;

      // Format A: messages array
      if (Array.isArray(parsed.messages)) {
        for (var i = parsed.messages.length - 1; i >= 0; i--) {
          var msg = parsed.messages[i];
          if (msg.role === 'user' || msg.role === 'human') {
            if (typeof msg.content === 'string') {
              if (!msg.content.startsWith(_tag)) {
                msg.content = _tag + ' ' + msg.content;
                tagged = true;
              }
            } else if (Array.isArray(msg.content)) {
              var tb = msg.content.find(function(b) { return b.type === 'text'; });
              if (tb && typeof tb.text === 'string' && !tb.text.startsWith(_tag)) {
                tb.text = _tag + ' ' + tb.text;
                tagged = true;
              }
            }
            break;
          }
        }
      }

      // Format B: direct prompt
      if (!tagged && typeof parsed.prompt === 'string' && !parsed.prompt.startsWith(_tag)) {
        parsed.prompt = _tag + ' ' + parsed.prompt;
        tagged = true;
      }

      if (tagged) {
        console.log('[Surface Tag] Message tagged');
        return _fetch.call(this, input, Object.assign({}, init, {
          body: JSON.stringify(parsed)
        }));
      }
    } catch(e) {
      // Not JSON — pass through
    }

    return _fetch.apply(this, arguments);
  };
})();
