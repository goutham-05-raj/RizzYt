/**
 * Gets video data using chrome.scripting.executeScript with world:'MAIN'
 * This runs directly in the YouTube page's JS context — always reliable.
 */
export async function getTranscript(videoId) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes('youtube.com/watch')) {
    throw new Error('Please navigate to a YouTube video page first, then click Summarize.');
  }

  // Execute a function directly inside the YouTube page's main JS world
  // This can read window.ytInitialPlayerResponse without any messaging
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: () => {
        const player = window.ytInitialPlayerResponse;
        if (!player) return null;

        const details = player.videoDetails || {};
        const captions = player.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

        const chapters = [];
        for (const panel of (player.engagementPanels || [])) {
          const items = panel?.engagementPanelSectionListRenderer?.content
            ?.macroMarkersListRenderer?.contents || [];
          for (const item of items) {
            const label = item?.macroMarkersListItemRenderer?.title?.simpleText;
            if (label) chapters.push(label);
          }
          if (chapters.length > 0) break;
        }

        return {
          title: details.title || document.title.replace(' - YouTube', '').trim(),
          description: details.shortDescription || '',
          captionTracks: captions,
          chapters,
          videoId: details.videoId || '',
        };
      },
    });
  } catch (err) {
    throw new Error(`Could not run on this tab. Please refresh the YouTube page. (${err.message})`);
  }

  const data = results?.[0]?.result;
  if (!data) {
    throw new Error('YouTube player data not loaded yet. Please wait for the video to fully load, then try again.');
  }

  // Try to fetch captions if available
  if (data.captionTracks?.length > 0) {
    const track =
      data.captionTracks.find(t => t.languageCode?.startsWith('en') && t.kind !== 'asr') ||
      data.captionTracks.find(t => t.languageCode?.startsWith('en')) ||
      data.captionTracks[0];

    if (track?.baseUrl) {
      try {
        const xmlRes = await fetch(track.baseUrl);
        const xml = await xmlRes.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const nodes = doc.querySelectorAll('text');
        if (nodes.length > 0) {
          const text = Array.from(nodes)
            .map(n => n.textContent
              .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/<[^>]*>/g, '').trim()
            )
            .filter(Boolean)
            .join(' ');
          return { type: 'transcript', content: text, title: data.title };
        }
      } catch {
        // fall through to description fallback
      }
    }
  }

  // Fallback: use title + description (always available on every YouTube video)
  return {
    type: 'metadata',
    content: data.description || '',
    title: data.title || `Video ${videoId}`,
    chapters: data.chapters || [],
  };
}


/**
 * Unified summarizer — supports Gemini and Groq.
 * Accepts the video data object and provider settings.
 */
export async function summarizeWithGemini(data, apiKey, customLength = 'medium', provider = 'groq', model = null) {
  // Strict length configs — both prompt instruction AND token cap enforced
  const lengthConfig = {
    short: {
      instruction: `STRICT: Write a SHORT summary. Maximum 5 bullet points. No headings. No extra sections. Total response must be under 150 words. Only the most critical points.`,
      maxTokens: 300,
    },
    medium: {
      instruction: `Write a MEDIUM summary with 2-3 main topic sections and 3-5 key takeaways. Total response around 250-400 words.`,
      maxTokens: 800,
    },
    long: {
      instruction: `Write a LONG, DETAILED summary. Cover all major topics, sub-topics, important quotes, and actionable takeaways in depth. Total response 500-800 words minimum.`,
      maxTokens: 2048,
    },
  };

  const cfg = lengthConfig[customLength] || lengthConfig.medium;

  const chaptersSection = data.chapters?.length > 0
    ? `\nCHAPTERS:\n${data.chapters.join('\n')}` : '';

  const prompt = data.type === 'transcript'
    ? `You are an expert content summarizer. Summarize the following YouTube video transcript.

${cfg.instruction}

${customLength === 'short' ? '' : `Use this format:
📌 **Overview**: (1-2 sentence overview)
🔑 **Key Topics**: (organized bullet points with headings)
💡 **Key Takeaways**: (actionable insights)
`}
TRANSCRIPT:
${data.content.substring(0, 30000)}`
    : `You are an expert content summarizer. Generate the best possible summary from this YouTube video metadata.

${cfg.instruction}

${customLength === 'short' ? '' : `Use this format:
📌 **Overview**: (1-2 sentence overview)
🔑 **Key Topics**: (organized bullet points — infer from description)
💡 **Key Takeaways**: (actionable insights)
`}
VIDEO TITLE: ${data.title || 'Unknown'}
${chaptersSection}
DESCRIPTION:
${(data.content || '').substring(0, 8000)}`;

  // ── Groq API (OpenAI-compatible) ──
  if (provider === 'groq') {
    const chosenModel = model || 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: cfg.maxTokens,   // ← enforced at API level
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error. Check your API key.');
    }
    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'Failed to generate summary.';
  }

  // ── Gemini API ──
  const chosenModel = model || 'gemini-2.0-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: cfg.maxTokens },  // ← enforced
      }),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API error. Check your API key.');
  }
  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate summary.';
}

/**
 * Fetches basic video info (title, channel) from YouTube's oEmbed endpoint.
 */
export async function getVideoInfo(videoId) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );
  if (!response.ok) return { title: 'Unknown Video', author_name: 'Unknown Channel' };
  return response.json();
}
