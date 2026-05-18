// LinkVault Bookmarklet
// Users can save this as a bookmark to quickly add links without the extension

(function() {
  'use strict';

  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  // Try to detect LinkVault dashboard
  const candidates = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  async function findDashboard() {
    for (const base of candidates) {
      try {
        const response = await fetch(`${base}/api/health`, {
          signal: AbortSignal.timeout(2000),
          mode: 'cors',
        });
        if (response.ok) {
          return base;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  async function saveLink() {
    const dashboard = await findDashboard();

    if (!dashboard) {
      alert('LinkVault dashboard not found. Please make sure it is running on localhost:3000 or configure your dashboard URL.');
      return;
    }

    try {
      const response = await fetch(`${dashboard}/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: window.location.href, title: document.title }),
        mode: 'cors',
      });

      const data = await response.json();

      if (data.alreadyExists) {
        alert('This link is already saved in LinkVault!');
      } else if (response.ok) {
        alert('Saved to LinkVault!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      // Fallback: open dashboard with pre-filled URL
      window.open(`${dashboard}/?action=add&url=${url}&title=${title}`, '_blank');
    }
  }

  saveLink();
})();
