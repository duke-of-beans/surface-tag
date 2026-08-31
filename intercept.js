/**
 * Surface Tag — intercept.js (v2.4)
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

  console.log('[Surface Tag] v2.4 intercept installed');

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

    // Case 2: Uint8Array / ArrayBuffer (claude.ai sends binary-encoded JSON)
    if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
      var bytes = body instanceof ArrayBuffer ? new Uint8Array(body) : body;
      var bodyText = new TextDecoder().decode(bytes);
      var result = tagBody(bodyText);
      if (result.tagged) {
        var newBody = new TextEncoder().encode(result.body);
        return _fetch.call(this, input, Object.assign({}, init, { body: newBody }));
      }
      return _fetch.apply(this, arguments);
    }

    // Case 3: Blob
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

    // Case 4: plain object with prompt (duck-type)
    if (body && typeof body === 'object' && typeof body.prompt === 'string') {
      if (!body.prompt.startsWith(_tag)) {
        body.prompt = _tag + ' ' + body.prompt;
        console.log('[Surface Tag] Tagged (object duck-type)');
      }
      return _fetch.apply(this, arguments);
    }

    // Case 5: Request object, no init body
    if (isRequest && body === null) {
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
        console.log('[Surface Tag] *** MESSAGE TAGGED ***');
        return { tagged: true, body: JSON.stringify(parsed) };
      }
    } catch(e) {}

    return { tagged: false, body: bodyStr };
  }
})();
