// Background Service Worker
// Listens for tab updates and stores the current YouTube video ID

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    const url = new URL(tab.url);
    const videoId = url.searchParams.get('v');
    if (videoId) {
      chrome.storage.local.set({ currentVideoId: videoId, currentTabId: tabId });
    }
  }
});
