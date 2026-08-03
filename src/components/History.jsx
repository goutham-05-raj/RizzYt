import { useState, useEffect } from 'react';

export default function History({ onClose }) {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const storage = chrome?.storage?.local || null;
    if (storage) {
      storage.get(['summaryHistory'], (result) => {
        setHistory(result.summaryHistory || []);
      });
    } else {
      const h = localStorage.getItem('summaryHistory');
      setHistory(h ? JSON.parse(h) : []);
    }
  }, []);

  const handleDownload = (item) => {
    const blob = new Blob([`${item.title}\n\n${item.summary}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    const storage = typeof chrome !== 'undefined' ? chrome.storage.local : null;
    if (storage) {
      storage.set({ summaryHistory: [] });
    } else {
      localStorage.setItem('summaryHistory', JSON.stringify([]));
    }
    setHistory([]);
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <h2>📚 Past Summaries</h2>
        {history.length > 0 && (
          <button className="clear-btn" onClick={handleClearAll}>Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">🎬</div>
          <p>No summaries yet. Summarize a YouTube video to get started!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={index} className={`history-card ${expanded === index ? 'expanded' : ''}`}>
              <div className="history-card-header" onClick={() => setExpanded(expanded === index ? null : index)}>
                <div className="history-title-wrap">
                  <span className="history-icon">▶</span>
                  <div>
                    <div className="history-title">{item.title}</div>
                    <div className="history-date">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className="chevron">{expanded === index ? '▲' : '▼'}</span>
              </div>
              {expanded === index && (
                <div className="history-body">
                  <div className="history-summary">{item.summary}</div>
                  <button className="download-btn-sm" onClick={() => handleDownload(item)}>
                    ⬇ Download .txt
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
