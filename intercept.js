/**
 * Surface Tag — intercept.js (v2.5)
 * MAIN world, document_start.
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

  console.log('[Surface Tag] v2.5 intercept installed');

  window.fetch = function(input, init) {
    if (!_tag) return _fetch.apply(this, arguments);

    var isRequest = input instanceof Request;
    var method = isRequest ? input.method : ((init && init.method) || 'GET');
    if (method.toUpperCase() !== 'POST') return _fetch.apply(this, arguments);

    var body = (init && init.body !== undefined) ? init.body : null;
    if (!body) return _fetch.apply(this, arguments);

    // Decode body to string regardless of type
    var bodyStr = null;

    if (typeof body === 'string') {
      bodyStr = body;
    } else if (ArrayBuffer.isView(body)) {
      // Uint8Array, Int8Array, DataView, etc. — cross-realm safe
      bodyStr = new TextDecoder().decode(body);
    } else if (body instanceof ArrayBuffer) {
      bodyStr = new TextDecoder().decode(new Uint8Array(body));
    } else if (body instanceof Blob) {
      // Async path
      return body.text().then(function(text) {
        return handleTag(text, input, init, 'blob');
      }.bind(this));
    } else {
      // Unknown type — log and pass through
      console.log('[Surface Tag] Unknown body type:', typeof body, body && body.constructor ? body.constructor.name : '?');
      return _fetch.apply(this, arguments);
    }

    if (bodyStr) {
      return handleTag.call(this, bodyStr, input, init, typeof body === 'string' ? 'string' : 'binary');
    }

    return _fetch.apply(this, arguments);
  };

  function handleTag(bodyStr, input, init, source) {
    try {
      var parsed = JSON.parse(bodyStr);
      var tagged = false;

      // Check messages array
      if (Array.isArray(parsed.messages)) {
        for (var i = parsed.messages.length - 1; i >= 0; i--) {
          var msg = parsed.messages[i];
          if (msg.role === 'user' || msg.role === 'human') {
            if (typeof msg.content === 'string' && !msg.content.startsWith(_tag)) {
              msg.content = _tag + ' ' + msg.content;
              tagged = true;
            }
            break;
          }
        }
      }

      // Check prompt field
      if (!tagged && typeof parsed.prompt === 'string' && !parsed.prompt.startsWith(_tag)) {
        parsed.prompt = _tag + ' ' + parsed.prompt;
        tagged = true;
      }

      if (tagged) {
        var newBody = JSON.stringify(parsed);
        console.log('[Surface Tag] *** TAGGED (' + source + ') ***');

        // Re-encode to match original body type
        if (source === 'binary') {
          newBody = new TextEncoder().encode(newBody);
        } else if (source === 'blob') {
          newBody = new Blob([newBody], { type: 'application/json' });
        }

        return _fetch.call(this, input, Object.assign({}, init, { body: newBody }));
      }
    } catch(e) {
      console.log('[Surface Tag] Parse error:', e.message, '| preview:', bodyStr.substring(0, 80));
    }

    return _fetch.call(this, input, init);
  }
})();
