(async () => {
  var api = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;
  var machineEl = document.getElementById('machine');
  var browserEl = document.getElementById('browserName');
  var previewEl = document.getElementById('preview');
  var statusEl = document.getElementById('status');
  var sourceEl = document.getElementById('source');

  // Show extension source path
  if (api.runtime && api.runtime.getURL) {
    var extUrl = api.runtime.getURL('');
    sourceEl.textContent = 'Loaded from: ' + extUrl;
  }

  function updatePreview() {
    var m = machineEl.value.trim();
    var b = browserEl.value.trim();
    if (m || b) {
      previewEl.textContent = '\u2301' + (m || '??') + '.' + (b || '??');
    } else {
      previewEl.textContent = '';
    }
  }

  // Load saved config
  try {
    var config = await api.storage.local.get(['machine', 'browserName']);
    machineEl.value = config.machine || '';
    browserEl.value = config.browserName || '';
    updatePreview();
  } catch(e) {
    statusEl.textContent = 'Error loading config';
  }

  machineEl.addEventListener('input', updatePreview);
  browserEl.addEventListener('input', updatePreview);

  document.getElementById('save').addEventListener('click', async () => {
    var machine = machineEl.value.trim();
    var browserName = browserEl.value.trim();

    try {
      await api.storage.local.set({ machine, browserName });
      updatePreview();
      statusEl.textContent = 'Saved. Reload claude.ai to apply.';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    } catch(e) {
      statusEl.textContent = 'Error saving';
    }
  });
})();
