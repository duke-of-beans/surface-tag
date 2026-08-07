/**
 * Surface Tag — popup config
 * 
 * Saves machine + browser name to extension storage.
 * The content script reads these on page load to build the tag.
 */

const api = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;

const machineInput = document.getElementById('machine');
const browserInput = document.getElementById('browserName');
const previewEl    = document.getElementById('preview');
const statusEl     = document.getElementById('status');

function updatePreview() {
  const m = machineInput.value.trim() || '??';
  const b = browserInput.value.trim() || '??';
  previewEl.textContent = '\u2301' + m + '.' + b;
}

async function loadConfig() {
  try {
    const config = await api.storage.local.get(['machine', 'browserName']);
    machineInput.value = config.machine || '';
    browserInput.value = config.browserName || '';
  } catch(e) {
    statusEl.textContent = 'Failed to load config';
  }
  updatePreview();
}

async function saveConfig() {
  const machine = machineInput.value.trim().toLowerCase();
  const browserName = browserInput.value.trim().toLowerCase();

  if (!machine && !browserName) {
    statusEl.textContent = 'Enter at least one field';
    return;
  }

  try {
    await api.storage.local.set({ machine, browserName });
    statusEl.textContent = 'Saved — reload claude.ai to apply';
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  } catch(e) {
    statusEl.textContent = 'Save failed';
  }
  updatePreview();
}

machineInput.addEventListener('input', updatePreview);
browserInput.addEventListener('input', updatePreview);
document.getElementById('save').addEventListener('click', saveConfig);

// Allow Enter to save
machineInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveConfig(); });
browserInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveConfig(); });

loadConfig();
