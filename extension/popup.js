let currentTab = null;
let pageMeta = null;
let tags = [];
let dashboardUrl = 'http://localhost:3000';

const PORT_CANDIDATES = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

// Injected into the page to read metadata directly from the DOM
function scrapePageMeta() {
  const getMeta = (name) => {
    const el = document.querySelector(`meta[property="og:${name}"]`) ||
                document.querySelector(`meta[name="${name}"]`);
    return el?.content?.trim() || '';
  };

  const getFavicon = () => {
    const el = document.querySelector('link[rel~="icon"]') ||
                document.querySelector('link[rel="shortcut icon"]') ||
                document.querySelector('link[rel="icon"]');
    return el?.href || '';
  };

  const resolveUrl = (href) => {
    if (!href) return '';
    if (href.startsWith('http')) return href;
    const a = document.createElement('a');
    a.href = href;
    return a.href;
  };

  return {
    title: document.title?.trim() || '',
    description: getMeta('description'),
    ogImage: resolveUrl(getMeta('image')),
    favicon: resolveUrl(getFavicon()),
    url: window.location.href,
    domain: window.location.hostname.replace('www.', ''),
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  await init();
});

async function init() {
  await loadDashboardUrl();
  await loadCurrentTab();
  setupEventListeners();
  await checkConnection();
}

async function loadDashboardUrl() {
  const result = await chrome.storage.local.get('dashboardUrl');
  if (result.dashboardUrl) {
    dashboardUrl = result.dashboardUrl;
    updateStatus('connected');
  } else {
    updateStatus('checking');
    const detected = await autoDetectDashboard();
    if (detected) {
      dashboardUrl = detected;
      await chrome.storage.local.set({ dashboardUrl });
      updateStatus('connected');
    } else {
      updateStatus('error', 'Dashboard not found');
    }
  }
}

async function autoDetectDashboard() {
  for (const url of PORT_CANDIDATES) {
    try {
      const response = await fetch(`${url}/api/stats`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        return url;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function checkConnection() {
  if (!dashboardUrl) return;
  try {
    const response = await fetch(`${dashboardUrl}/api/stats`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    updateStatus(response.ok ? 'connected' : 'error');
  } catch {
    updateStatus('error', 'Offline');
  }
}

function updateStatus(state, text) {
  const dot = document.getElementById('status-dot');
  const label = document.getElementById('status-text');

  dot.className = 'status-dot';
  if (state === 'connected') {
    dot.classList.add('connected');
    label.textContent = text || 'Connected';
  } else if (state === 'checking') {
    label.textContent = text || 'Checking...';
  } else {
    dot.classList.add('error');
    label.textContent = text || 'Offline';
  }
}

async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Scrape metadata directly from the page DOM
    let meta = null;
    if (tab.id && !tab.url?.startsWith('chrome://')) {
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapePageMeta,
        });
        meta = result;
      } catch {
        // Restricted page (chrome://, file://, etc.)
      }
    }

    // Fallback to tab API data if DOM scrape failed
    pageMeta = meta || {
      title: tab.title || '',
      description: '',
      ogImage: '',
      favicon: '',
      url: tab.url,
      domain: extractDomain(tab.url),
    };

    document.getElementById('page-url').textContent = pageMeta.url;
    document.getElementById('page-title').textContent = pageMeta.title || pageMeta.url;
  } catch {
    document.getElementById('page-title').textContent = 'Unable to read page';
  }
}

function setupEventListeners() {
  document.getElementById('save-btn').addEventListener('click', saveLink);

  document.getElementById('tag-input').addEventListener('keydown', handleTagInput);

  document.getElementById('dashboard-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: dashboardUrl });
  });

  document.getElementById('save-another').addEventListener('click', resetForm);

  document.getElementById('settings-btn').addEventListener('click', async () => {
    const newUrl = prompt('Dashboard URL:', dashboardUrl);
    if (newUrl && newUrl !== dashboardUrl) {
      dashboardUrl = newUrl;
      await chrome.storage.local.set({ dashboardUrl });
      await checkConnection();
    }
  });
}

function handleTagInput(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const value = e.target.value.trim().replace(/,/g, '');
    if (value && !tags.includes(value)) {
      tags.push(value);
      renderTags();
    }
    e.target.value = '';
  }
}

function renderTags() {
  const container = document.getElementById('tags-container');
  const input = document.getElementById('tag-input');

  container.querySelectorAll('.tag').forEach(el => el.remove());

  tags.forEach((tag, index) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${tag} <button data-index="${index}">&times;</button>`;
    container.insertBefore(el, input);
  });

  container.querySelectorAll('.tag button').forEach(btn => {
    btn.addEventListener('click', () => {
      tags.splice(parseInt(btn.dataset.index), 1);
      renderTags();
    });
  });
}

function setLoading(loading) {
  const btn = document.getElementById('save-btn');
  btn.disabled = loading;
  btn.classList.toggle('saving', loading);
}

function showError(message) {
  const errorEl = document.getElementById('error-msg');
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function hideError() {
  document.getElementById('error-msg').classList.remove('show');
}

async function saveLink() {
  hideError();

  if (!dashboardUrl) {
    showError('Dashboard not configured. Check Settings below.');
    return;
  }

  if (!pageMeta || !pageMeta.url || pageMeta.url.startsWith('chrome://')) {
    showError('Cannot save this page.');
    return;
  }

  setLoading(true);

  try {
    const category = document.getElementById('category').value;

    const response = await fetch(`${dashboardUrl}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageMeta.url,
        title: pageMeta.title,
        description: pageMeta.description,
        category,
        tags,
        ogImage: pageMeta.ogImage,
        favicon: pageMeta.favicon,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.alreadyExists) {
      showError('This link is already in your vault.');
      setLoading(false);
      return;
    }

    const link = data.link || {};
    showSuccess(link);
  } catch (error) {
    const msg = error.name === 'AbortError'
      ? 'Request timed out. Is the dashboard running?'
      : 'Failed to save. Check that the dashboard is running.';
    showError(msg);
    updateStatus('error', 'Save failed');
    setLoading(false);
  }
}

function showSuccess(link) {
  document.getElementById('form-view').style.display = 'none';
  document.getElementById('success-view').classList.add('show');

  const title = link.title || pageMeta?.title || 'Saved link';
  const domain = link.domain || pageMeta?.domain || extractDomain(pageMeta?.url || '');
  const favicon = link.favicon_url || pageMeta?.favicon;

  document.getElementById('saved-title').textContent = title;
  document.getElementById('saved-domain').textContent = domain;

  const faviconEl = document.getElementById('saved-favicon');
  if (favicon) {
    faviconEl.innerHTML = `<img src="${favicon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`;
  } else {
    const initials = domain.split('.')[0].slice(0, 2).toUpperCase();
    faviconEl.innerHTML = `<span class="fallback">${initials || 'LV'}</span>`;
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function resetForm() {
  tags = [];
  renderTags();
  document.getElementById('category').value = 'uncategorized';
  document.getElementById('success-view').classList.remove('show');
  document.getElementById('form-view').style.display = 'block';
  hideError();
  setLoading(false);
}
