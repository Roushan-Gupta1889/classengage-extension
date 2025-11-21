// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('ClassEngage extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('BG got message', message, sender);
  if (message?.type === 'PING') {
    sendResponse({ type: 'PONG' });
  }
});
