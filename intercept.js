/**
 * Surface Tag — intercept.js (v2.0)
 * MAIN world, document_start.
 * Overrides fetch, tags outgoing user messages.
 *
 * Handles modern fetch patterns:
 *   - fetch(url, {body: string})
 *   - fetch(url, {body: Blob/ArrayBuffer})
 *   - fetch(Request) with no init
 *   - Mixed: fetch(Request, init)
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
    if (!_tag) return _fetch.apply(this, arguments);

    // Normalize method and body from either Request object or init
    var method, body, url;

    if (input instanceof Request) {
      method = (init && init.method) || input.method;
      url = input.url;
      // If init has a body, use it; otherwise we need to clone the Request
      if (init && typeof init.body === 'string') {
        body = init.body;
      } else if (init && init.body) {
        // Non-string body in init — can't parse, pass through
        return _fetch.apply(this, arguments);
      } else {
        // Body is on the Request object — clone and read it
        // But Request.body is a ReadableStream, reading is async
        // Use the sync approach: clone, read via text(), rebuild
        var cloned = input.clone();
        return cloned.text().then(function(bodyText) {
          var result = tagBody(bodyText);
          if (result.tagged) {
            var newInit = Object.assign({}, init || {}, {
              method: method,
              body: result.body,
              headers: new Headers(init && init.headers || input.headers)
            });
            // Preserve all original headers
            if (!(init && init.headers)) {
              input.headers.forEach(function(v, k) {
                newInit.headers.set(k, v);
              });
            }
            return _fetch.call(this, url, newInit);
          }
          return _fetch.call(this, input, init);
        }.bind(this));
      }
    } else {
      method = (init && init.method) || 'GET';
      url = input;
      body = (init && init.body) || null;
    }

    if (method.toUpperCase() !== 'POST' || typeof body !== 'string') {
      return _fetch.apply(this, arguments);
    }

    var result = tagBody(body);
    if (result.tagged) {
      return _fetch.call(this, input, Object.assign({}, init, {
        body: result.body
      }));
    }

    return _fetch.apply(this, arguments);
  };

  function tagBody(bodyStr) {
    try {
      var parsed = JSON.parse(bodyStr);
      var tagged = false;

      // Format A: messages array (API format)
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

      // Format B: prompt field (claude.ai web app format)
      if (!tagged && typeof parsed.prompt === 'string' && !parsed.prompt.startsWith(_tag)) {
        parsed.prompt = _tag + ' ' + parsed.prompt;
        tagged = true;
      }

      if (tagged) {
        console.log('[Surface Tag] Message tagged');
        return { tagged: true, body: JSON.stringify(parsed) };
      }
    } catch(e) {
      // Not JSON
    }

    return { tagged: false, body: bodyStr };
  }
})();
