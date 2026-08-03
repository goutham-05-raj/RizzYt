// Content Script — Manifest V3 isolated world fix
// Content scripts can't directly read page JS variables.
// We inject a <script> tag into the page context to extract the data,
// then communicate it back via a custom DOM event.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoData') {

    // Listen for the data event from the injected page-context script
    document.addEventListener('__ytSummarizerData__', function handler(event) {
      document.removeEventListener('__ytSummarizerData__', handler);

      if (!event.detail) {
        sendResponse({ error: 'Could not read YouTube player data. Please refresh the page and try again.' });
      } else {
        sendResponse(event.detail);
      }
    }, { once: true });

    // Inject a script that runs in the PAGE context (not isolated world)
    // so it can read window.ytInitialPlayerResponse
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          const player = window.ytInitialPlayerResponse;
          const details = player?.videoDetails || {};
          const captions = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

          // Extract chapters
          const chapters = [];
          const panels = player?.engagementPanels || [];
          for (const panel of panels) {
            const items = panel?.engagementPanelSectionListRenderer?.content
              ?.macroMarkersListRenderer?.contents || [];
            for (const item of items) {
              const label = item?.macroMarkersListItemRenderer?.title?.simpleText;
              if (label) chapters.push(label);
            }
            if (chapters.length > 0) break;
          }

          document.dispatchEvent(new CustomEvent('__ytSummarizerData__', {
            detail: {
              title: details.title || document.title.replace(' - YouTube', '').trim(),
              description: details.shortDescription || '',
              captionTracks: captions,
              chapters: chapters,
              videoId: details.videoId || '',
            }
          }));
        } catch(e) {
          document.dispatchEvent(new CustomEvent('__ytSummarizerData__', { detail: null }));
        }
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    return true; // keep the message channel open for async response
  }
});
