// popup.js
document.getElementById('startSession').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const active = tabs[0];
  if (!active || !active.url) {
    alert('Open a Google Meet tab and try again');
    return;
  }
  if (!active.url.includes('meet.google.com')) {
    alert('Please open a Google Meet tab first.');
    return;
  }
  // extract meet id from URL
  try {
    const url = new URL(active.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const meetId = parts[0] || 'unknown';
    document.getElementById('meetInfo').innerHTML = `Meeting: <strong>${meetId}</strong>`;
    // In future: create session in Firebase
    alert('Detected meeting: ' + meetId + '\n(Next: we will create a session in Firebase)');
  } catch (err) {
    alert('Failed to parse Meet URL');
  }
});

document.getElementById('openDashboard').addEventListener('click', () => {
  // open dashboard hosted later (for now open a placeholder)
  chrome.tabs.create({ url: 'about:blank' });
});
