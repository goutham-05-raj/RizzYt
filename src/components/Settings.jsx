import { useState, useEffect } from 'react';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    dot: 'linear-gradient(135deg, #4285f4, #34a853)',
    placeholder: 'AIza...',
    link: 'https://aistudio.google.com/app/apikey',
    linkText: 'Get free key at Google AI Studio →',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  },
  {
    id: 'groq',
    name: 'Groq (Free & Fast)',
    dot: 'linear-gradient(135deg, #f97316, #ef4444)',
    placeholder: 'gsk_...',
    link: 'https://console.groq.com/keys',
    linkText: 'Get free key at Groq Console →',
    models: ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
  },
];

export default function Settings({ onSave }) {
  const [provider, setProvider] = useState('groq');
  const [keys, setKeys] = useState({ gemini: '', groq: '' });
  const [models, setModels] = useState({ gemini: 'gemini-2.0-flash', groq: 'llama-3.3-70b-versatile' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storage = chrome?.storage?.local || null;
    if (storage) {
      storage.get(['aiProvider', 'geminiApiKey', 'groqApiKey', 'geminiModel', 'groqModel'], (result) => {
        if (result.aiProvider) setProvider(result.aiProvider);
        setKeys({ gemini: result.geminiApiKey || '', groq: result.groqApiKey || '' });
        setModels({
          gemini: result.geminiModel || 'gemini-2.0-flash',
          groq: result.groqModel || 'llama-3.3-70b-versatile',
        });
      });
    } else {
      setProvider(localStorage.getItem('aiProvider') || 'groq');
      setKeys({
        gemini: localStorage.getItem('geminiApiKey') || '',
        groq: localStorage.getItem('groqApiKey') || '',
      });
    }
  }, []);

  const handleSave = () => {
    const storage = chrome?.storage?.local || null;
    if (storage) {
      storage.set({
        aiProvider: provider,
        geminiApiKey: keys.gemini,
        groqApiKey: keys.groq,
        geminiModel: models.gemini,
        groqModel: models.groq,
      });
    } else {
      localStorage.setItem('aiProvider', provider);
      localStorage.setItem('geminiApiKey', keys.gemini);
      localStorage.setItem('groqApiKey', keys.groq);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSave) onSave();
  };

  const current = PROVIDERS.find(p => p.id === provider);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-icon">⚙️</div>
        <h2>AI Settings</h2>
        <p>Choose your AI provider and enter your API key.</p>
      </div>

      {/* Provider Selector */}
      <div className="provider-tabs">
        {PROVIDERS.map(p => (
          <button
            key={p.id}
            className={`provider-tab ${provider === p.id ? 'active' : ''}`}
            onClick={() => setProvider(p.id)}
          >
            <span className="provider-dot" style={{ background: p.dot }}></span>
            {p.name}
          </button>
        ))}
      </div>

      {/* API Key Input */}
      <div className="api-key-card">
        <div className="card-label">
          <span className="gemini-dot" style={{ background: current.dot }}></span>
          {current.name} API Key
        </div>
        <input
          type="password"
          placeholder={current.placeholder}
          value={keys[provider]}
          onChange={e => setKeys({ ...keys, [provider]: e.target.value })}
          className="api-input"
        />

        {/* Model Selector */}
        <div className="card-label" style={{ marginTop: '10px' }}>Model</div>
        <select
          className="api-input"
          value={models[provider]}
          onChange={e => setModels({ ...models, [provider]: e.target.value })}
          style={{ fontFamily: 'inherit' }}
        >
          {current.models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="api-help">
          <a href={current.link} target="_blank" rel="noreferrer">{current.linkText}</a>
        </div>
      </div>

      <button
        className={`save-btn ${saved ? 'saved' : ''}`}
        onClick={handleSave}
        disabled={!keys[provider].trim()}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      <div className="info-box">
        <span>🔒</span>
        <p>Your API keys are stored locally on your device only and never sent to any third-party server.</p>
      </div>

      <div className="info-box" style={{ marginTop: '8px' }}>
        <span>⚡</span>
        <p><strong>Groq is recommended</strong> — faster, free tier has 14,400 req/day vs Gemini's 1,500.</p>
      </div>
    </div>
  );
}
