import { useState } from 'react';
import Summarizer from './components/Summarizer';
import Settings from './components/Settings';
import History from './components/History';
import './index.css';

const TABS = [
  { id: 'summarize', label: '✨ Summarize', icon: '✨' },
  { id: 'history', label: '📚 History', icon: '📚' },
  { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
];

function App() {
  const [activeTab, setActiveTab] = useState('summarize');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">▶</span>
          <div>
            <div className="app-name">Rizzyt</div>
            <div className="app-tagline">YouTube Summarizer</div>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label.split(' ')[1]}
          </button>
        ))}
      </nav>

      <main className="app-content">
        {activeTab === 'summarize' && <Summarizer />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings onSave={() => setActiveTab('summarize')} />}
      </main>
    </div>
  );
}

export default App;
