import { useState, useEffect } from 'react';
import { getTranscript, summarizeWithGemini, getVideoInfo } from '../utils/api';

export default function Summarizer() {
  const [videoId, setVideoId] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const storage = chrome?.storage?.local || null;

    if (storage) {
      storage.get(['aiProvider', 'geminiApiKey', 'groqApiKey', 'geminiModel', 'groqModel'], (result) => {
        const p = result.aiProvider || 'groq';
        setProvider(p);
        setApiKey(p === 'groq' ? (result.groqApiKey || '') : (result.geminiApiKey || ''));
        setModel(p === 'groq' ? (result.groqModel || 'llama-3.3-70b-versatile') : (result.geminiModel || 'gemini-2.0-flash'));
      });

      if (chrome?.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab?.url?.includes('youtube.com/watch')) {
            const url = new URL(tab.url);
            const id = url.searchParams.get('v');
            if (id) {
              setVideoId(id);
              fetchVideoInfo(id);
            }
          }
        });
      }
    } else {
      // Dev mode: allow manual input via localStorage
      const key = localStorage.getItem('geminiApiKey');
      if (key) setApiKey(key);
    }
  }, []);

  const fetchVideoInfo = async (id) => {
    try {
      const info = await getVideoInfo(id);
      setVideoInfo(info);
    } catch (e) {
      console.error('Could not fetch video info', e);
    }
  };

  const handleSummarize = async () => {
    if (!apiKey) {
      setError('Please set your Gemini API key in Settings first.');
      return;
    }
    if (!videoId) {
      setError('Please navigate to a YouTube video and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setProgress('📄 Fetching video transcript...');

    try {
      const transcript = await getTranscript(videoId);
      setProgress('🤖 AI is summarizing...');
      const result = await summarizeWithGemini(transcript, apiKey, summaryLength, provider, model);
      setSummary(result);
      saveToHistory(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const saveToHistory = (summaryText) => {
    const newEntry = {
      videoId,
      title: videoInfo?.title || `Video ${videoId}`,
      summary: summaryText,
      date: new Date().toISOString(),
    };
    const storage = chrome?.storage?.local || null;
    const getter = (cb) => storage
      ? storage.get(['summaryHistory'], cb)
      : cb({ summaryHistory: JSON.parse(localStorage.getItem('summaryHistory') || '[]') });
    getter((result) => {
      const updated = [newEntry, ...(result.summaryHistory || [])].slice(0, 20);
      if (storage) storage.set({ summaryHistory: updated });
      else localStorage.setItem('summaryHistory', JSON.stringify(updated));
    });
  };

  const handleDownload = () => {
    const title = videoInfo?.title || `Video_${videoId}`;
    const content = `VIDEO SUMMARY\n${'='.repeat(60)}\nTitle: ${title}\nURL: https://youtube.com/watch?v=${videoId}\nDate: ${new Date().toLocaleDateString()}\n${'='.repeat(60)}\n\n${summary}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleManualId = (e) => {
    const val = e.target.value;
    setVideoId(val);
    if (val.length === 11) fetchVideoInfo(val);
  };

  return (
    <div className="summarizer-page">
      {/* Video Info Card */}
      <div className="video-card">
        {videoInfo ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt={videoInfo.title}
              className="video-thumb"
            />
            <div className="video-meta">
              <div className="video-title">{videoInfo.title}</div>
              <div className="video-channel">▶ {videoInfo.author_name}</div>
            </div>
          </>
        ) : (
          <div className="no-video">
            <div className="no-video-icon">🎬</div>
            <p>Navigate to a YouTube video,<br />then click Summarize.</p>
            <input
              className="manual-id-input"
              placeholder="Or paste a video ID manually..."
              value={videoId}
              onChange={handleManualId}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="length-selector">
          {['short', 'medium', 'long'].map(l => (
            <button
              key={l}
              className={`length-btn ${summaryLength === l ? 'active' : ''}`}
              onClick={() => setSummaryLength(l)}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <button
          className="summarize-btn"
          onClick={handleSummarize}
          disabled={loading || !videoId}
        >
          {loading ? (
            <span className="loading-inner">
              <span className="spinner"></span> {progress || 'Processing...'}
            </span>
          ) : 'Summarize'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* Summary Output */}
      {summary && (
        <div className="summary-output fade-in">
          <div className="summary-header">
            <span>📋 Summary</span>
            <button className="download-btn" onClick={handleDownload}>⬇ Download</button>
          </div>
          <div className="summary-text">{summary}</div>
        </div>
      )}
    </div>
  );
}
