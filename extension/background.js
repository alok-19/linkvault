const DEFAULT_DASHBOARD_URL = 'http://localhost:3000';
const PORT_CANDIDATES = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const QUEUE_KEY = 'linkvault_queue';

// DOM scraper injected into pages
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

async function getDashboardUrl() {
  const result = await chrome.storage.local.get('dashboardUrl');
  if (result.dashboardUrl) {
    return result.dashboardUrl;
  }

  for (const url of PORT_CANDIDATES) {
    try {
      const response = await fetch(`${url}/api/stats`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) {
        await chrome.storage.local.set({ dashboardUrl: url });
        return url;
      }
    } catch {
      continue;
    }
  }

  return DEFAULT_DASHBOARD_URL;
}

async function getQueue() {
  const result = await chrome.storage.local.get(QUEUE_KEY);
  return result[QUEUE_KEY] || [];
}

async function addToQueue(url, title) {
  const queue = await getQueue();
  queue.push({ url, title, timestamp: Date.now() });
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
}

async function removeFromQueue(index) {
  const queue = await getQueue();
  queue.splice(index, 1);
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
}

async function updateBadge(tabId, text, color) {
  try {
    await chrome.action.setBadgeText({ text, tabId });
    if (color) {
      await chrome.action.setBadgeBackgroundColor({ color, tabId });
    }
  } catch {
    // Tab may have closed
  }
}

async function clearBadge(tabId) {
  setTimeout(async () => {
    try {
      await chrome.action.setBadgeText({ text: '', tabId });
    } catch {
      // Ignore
    }
  }, 2000);
}

async function scrapeTabMeta(tabId) {
  if (!tabId) return null;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: scrapePageMeta,
    });
    return result;
  } catch {
    return null;
  }
}

async function doSave(url, title, tabId) {
  const dashboardUrl = await getDashboardUrl();

  // Try to extract metadata from the page DOM
  let meta = null;
  if (tabId) {
    meta = await scrapeTabMeta(tabId);
  }

  const payload = meta
    ? {
        url: meta.url || url,
        title: meta.title || title,
        description: meta.description,
        ogImage: meta.ogImage,
        favicon: meta.favicon,
      }
    : { url, title };

  try {
    const response = await fetch(`${dashboardUrl}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json().catch(() => ({}));

    if (data.alreadyExists) {
      await updateBadge(tabId, '!', '#f59e0b');
    } else if (response.ok) {
      await updateBadge(tabId, String.fromCharCode(10003), '#22c55e');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }

    clearBadge(tabId);
    return true;
  } catch {
    await addToQueue(url, title);
    const queue = await getQueue();
    await updateBadge(tabId, String(queue.length), '#ef4444');
    clearBadge(tabId);
    return false;
  }
}

async function processQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  const dashboardUrl = await getDashboardUrl();
  let processed = 0;

  for (let i = queue.length - 1; i >= 0; i--) {
    const item = queue[i];
    try {
      const response = await fetch(`${dashboardUrl}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url, title: item.title }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        await removeFromQueue(i);
        processed++;
      }
    } catch {
      break;
    }
  }

  if (processed > 0) {
    const remaining = await getQueue();
    if (remaining.length > 0) {
      await chrome.action.setBadgeText({ text: String(remaining.length) });
      await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  }
}

// Periodic queue retry
chrome.alarms.create('retry-queue', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retry-queue') {
    processQueue();
  }
});

// Setup context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-linkvault',
    title: 'Save to LinkVault',
    contexts: ['page', 'link'],
  });
});

// Context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-linkvault') {
    const url = info.linkUrl || tab.url;
    await doSave(url, tab.title, tab.id);
  }
});

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-link') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await doSave(tab.url, tab.title, tab.id);
    }
  }
});

// Process queue on startup
chrome.runtime.onStartup.addListener(() => {
  processQueue();
});
