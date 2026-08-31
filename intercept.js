/**
 * Surface Tag — intercept.js (v2.2)
 * MAIN world, document_start.
 *
 * Handles all fetch body types:
 *   - string (JSON.stringify'd by caller)
 *   - plain object (not yet stringified — claude.ai does this)
 *   - Blob / ReadableStream (async read)
 *   - Request objects
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

  console.log('[Surface Tag] v2.2 intercept installed');

  window.fetch = function(input, init) {
    if (!_tag) return _fetch.apply(this, arguments);

    var isRequest = input instanceof Request;
    var method = isRequest ? input.method : ((init && init.method) || 'GET');

    if (method.toUpperCase() !== 'POST') return _fetch.apply(this, arguments);

    var body = (init && init.body !== undefined) ? init.body : null;

    // Case 1: string body
    if (typeof body === 'string') {
      var result = tagBody(body);
      if (result.tagged) {
        return _fetch.call(this, input, Object.assign({}, init, { body: result.body }));
      }
      return _fetch.apply(this, arguments);
    }

    // Case 2: plain object body (claude.ai passes unserialized objects)
    if (body && typeof body === 'object' && !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer) && !(body instanceof FormData) &&
        !(body instanceof URLSearchParams) && !(body instanceof ReadableStream)) {
      // It's a plain JS object — tag it directly, then stringify
      var tagged = false;
      if (typeof body.prompt === 'string' && !body.prompt.startsWith(_tag)) {
        body.prompt = _tag + ' ' + body.prompt;
        tagged = true;
      }
      if (!tagged && Array.isArray(body.messages)) {
        for (var i = body.messages.length - 1; i >= 0; i--) {
          var msg = body.messages[i];
          if (msg.role === 'user' || msg.role === 'human') {
            if (typeof msg.content === 'string' && !msg.content.startsWith(_tag)) {
              msg.content = _tag + ' ' + msg.content;
              tagged = true;
            }
            break;
          }
        }
      }
      if (tagged) {
        console.log('[Surface Tag] *** MESSAGE TAGGED (object body) ***');
        // Pass modified object back — let the downstream serializer handle it
        return _fetch.apply(this, arguments);
      }
      return _fetch.apply(this, arguments);
    }

    // Case 3: Blob body
    if (body instanceof Blob) {
      return body.text().then(function(bodyText) {
        var result = tagBody(bodyText);
        if (result.tagged) {
          return _fetch.call(this, input, Object.assign({}, init, {
            body: new Blob([result.body], { type: body.type })
          }));
        }
        return _fetch.call(this, input, init);
      }.bind(this));
    }

    // Case 4: Request object with no init body
    if (isRequest && !body) {
      var cloned = input.clone();
      return cloned.text().then(function(bodyText) {
        var result = tagBody(bodyText);
        if (result.tagged) {
          return _fetch.call(this, new Request(input, { body: result.body }));
        }
        return _fetch.call(this, input, init);
      }.bind(this));
    }

    return _fetch.apply(this, arguments);
  };

  function tagBody(bodyStr) {
    try {
      var parsed = JSON.parse(bodyStr);
      var tagged = false;

      if (Array.isArray(parsed.messages)) {
        for (var i = parsed.messages.length - 1; i >= 0; i--) {
          var msg = parsed.messages[i];
          if (msg.role === 'user' || msg.role === 'human') {
            if (typeof msg.content === 'string' && !msg.content.startsWith(_tag)) {
              msg.content = _tag + ' ' + msg.content;
              tagged = true;
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

      if (!tagged && typeof parsed.prompt === 'string' && !parsed.prompt.startsWith(_tag)) {
        parsed.prompt = _tag + ' ' + parsed.prompt;
        tagged = true;
      }

      if (tagged) {
        console.log('[Surface Tag] *** MESSAGE TAGGED (string body) ***');
        return { tagged: true, body: JSON.stringify(parsed) };
      }
    } catch(e) {}

    return { tagged: false, body: bodyStr };
  }
})();
