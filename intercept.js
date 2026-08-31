/**
 * Surface Tag — intercept.js (v3.0.0)
 * MAIN world, document_start.
 *
 * Overrides window.fetch to prepend a surface tag (e.g. ⌁g7.brave)
 * to outgoing messages on claude.ai.
 *
 * Body type handling (claude.ai sends Uint8Array as of Aug 2026):
 *   - string: direct JSON parse
 *   - Uint8Array / typed array: TextDecoder → JSON parse (cross-realm via ArrayBuffer.isView)
 *   - ArrayBuffer: wrap in Uint8Array → decode
 *   - Blob: async .text() → JSON parse
 *   - Request object with no init: clone → .text() → JSON parse
 *
 * Tagged fields:
 *   - prompt (claude.ai web format)
 *   - messages[last user].content (API format)
 */

(function() {
  'use strict';

  var _fetch = window.fetch;
  var _tag = null;
  var _tagCount = 0;

  window.addEventListener('message', function(e) {
    if (e.source === window && e.data && e.data.type === '__SURFACE_TAG') {
      _tag = e.data.tag;
    }
  });

  window.fetch = function(input, init) {
    if (!_tag) return _fetch.apply(this, arguments);

    var isRequest = input instanceof Request;
    var method = isRequest ? input.method : ((init && init.method) || 'GET');
    if (method.toUpperCase() !== 'POST') return _fetch.apply(this, arguments);

    var body = (init && init.body !== undefined) ? init.body : null;
    if (!body && !isRequest) return _fetch.apply(this, arguments);

    // Decode body to string
    if (typeof body === 'string') {
      return syncTag.call(this, body, input, init, 'string');
    }

    if (ArrayBuffer.isView(body)) {
      return syncTag.call(this, new TextDecoder().decode(body), input, init, 'binary');
    }

    if (body instanceof ArrayBuffer) {
      return syncTag.call(this, new TextDecoder().decode(new Uint8Array(body)), input, init, 'binary');
    }

    if (body instanceof Blob) {
      return body.text().then(function(text) {
        return asyncTag.call(this, text, input, init, 'blob');
      }.bind(this));
    }

    // Request object with body on the Request, not in init
    if (isRequest && !body) {
      var cloned = input.clone();
      return cloned.text().then(function(text) {
        return asyncTag.call(this, text, input, init, 'request');
      }.bind(this));
    }

    return _fetch.apply(this, arguments);
  };

  function tryTag(bodyStr) {
    try {
      var parsed = JSON.parse(bodyStr);

      // claude.ai web: prompt field
      if (typeof parsed.prompt === 'string' && parsed.prompt !== '' && !parsed.prompt.startsWith(_tag)) {
        parsed.prompt = _tag + ' ' + parsed.prompt;
        _tagCount++;
        console.log('[Surface Tag] Tagged message #' + _tagCount);
        return JSON.stringify(parsed);
      }

      // API format: messages array
      if (Array.isArray(parsed.messages)) {
        for (var i = parsed.messages.length - 1; i >= 0; i--) {
          var msg = parsed.messages[i];
          if (msg.role === 'user' || msg.role === 'human') {
            if (typeof msg.content === 'string' && !msg.content.startsWith(_tag)) {
              msg.content = _tag + ' ' + msg.content;
              _tagCount++;
              console.log('[Surface Tag] Tagged message #' + _tagCount);
              return JSON.stringify(parsed);
            } else if (Array.isArray(msg.content)) {
              var tb = msg.content.find(function(b) { return b.type === 'text'; });
              if (tb && typeof tb.text === 'string' && !tb.text.startsWith(_tag)) {
                tb.text = _tag + ' ' + tb.text;
                _tagCount++;
                console.log('[Surface Tag] Tagged message #' + _tagCount);
                return JSON.stringify(parsed);
              }
            }
            break;
          }
        }
      }
    } catch(e) {
      // Not JSON — ignore silently
    }
    return null;
  }

  function syncTag(bodyStr, input, init, source) {
    var tagged = tryTag(bodyStr);
    if (tagged) {
      var newBody = source === 'binary' ? new TextEncoder().encode(tagged) : tagged;
      return _fetch.call(this, input, Object.assign({}, init, { body: newBody }));
    }
    return _fetch.call(this, input, init);
  }

  function asyncTag(bodyStr, input, init, source) {
    var tagged = tryTag(bodyStr);
    if (tagged) {
      var newBody = source === 'blob'
        ? new Blob([tagged], { type: 'application/json' })
        : tagged;
      if (source === 'request') {
        return _fetch.call(this, new Request(input, { body: newBody }));
      }
      return _fetch.call(this, input, Object.assign({}, init, { body: newBody }));
    }
    return _fetch.call(this, input, init);
  }
})();
