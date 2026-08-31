/**
 * Surface Tag — intercept.js (v2.1 — diagnostic build)
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

  console.log('[Surface Tag] v2.1 intercept installed');

  window.fetch = function(input, init) {
    // Log every fetch to see what we're catching
    var isRequest = input instanceof Request;
    var method = isRequest ? input.method : ((init && init.method) || 'GET');
    var url = isRequest ? input.url : (typeof input === 'string' ? input : '');

    // Only log POST requests to reduce noise
    if (method.toUpperCase() === 'POST') {
      var bodySource = 'none';
      if (init && init.body) bodySource = 'init.body (' + typeof init.body + ')';
      else if (isRequest) bodySource = 'Request.body';
      console.log('[Surface Tag] POST intercepted:', url.substring(0, 80), '| body from:', bodySource, '| tag:', _tag ? 'set' : 'NOT SET');
    }

    if (!_tag) return _fetch.apply(this, arguments);
    if (method.toUpperCase() !== 'POST') return _fetch.apply(this, arguments);

    // Try init.body first (most common for fetch(url, {method, body}))
    if (init && typeof init.body === 'string') {
      var result = tagBody(init.body);
      if (result.tagged) {
        return _fetch.call(this, input, Object.assign({}, init, { body: result.body }));
      }
      return _fetch.apply(this, arguments);
    }

    // If input is Request, clone and read body
    if (isRequest) {
      var cloned = input.clone();
      return cloned.text().then(function(bodyText) {
        console.log('[Surface Tag] Request body read, length:', bodyText.length, 'preview:', bodyText.substring(0, 100));
        var result = tagBody(bodyText);
        if (result.tagged) {
          // Rebuild the request with tagged body
          var newReq = new Request(input, { body: result.body });
          return _fetch.call(this, newReq);
        }
        return _fetch.call(this, input, init);
      }.bind(this)).catch(function(err) {
        console.warn('[Surface Tag] Request body read failed:', err);
        return _fetch.call(this, input, init);
      }.bind(this));
    }

    return _fetch.apply(this, arguments);
  };

  function tagBody(bodyStr) {
    try {
      var parsed = JSON.parse(bodyStr);
      var keys = Object.keys(parsed);
      console.log('[Surface Tag] Parsed body keys:', keys.join(', '));

      var tagged = false;

      // Format A: messages array
      if (Array.isArray(parsed.messages)) {
        console.log('[Surface Tag] Found messages array, length:', parsed.messages.length);
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

      // Format B: prompt field
      if (!tagged && typeof parsed.prompt === 'string') {
        console.log('[Surface Tag] Found prompt field:', JSON.stringify(parsed.prompt).substring(0, 50));
        if (!parsed.prompt.startsWith(_tag)) {
          parsed.prompt = _tag + ' ' + parsed.prompt;
          tagged = true;
        }
      }

      if (tagged) {
        console.log('[Surface Tag] *** MESSAGE TAGGED ***');
        return { tagged: true, body: JSON.stringify(parsed) };
      } else {
        console.log('[Surface Tag] Body parsed but no taggable field found');
      }
    } catch(e) {
      console.log('[Surface Tag] Body parse failed:', e.message);
    }

    return { tagged: false, body: bodyStr };
  }
})();
