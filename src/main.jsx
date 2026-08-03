import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Simple error boundary using class component
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#f87171', fontFamily: 'monospace', fontSize: '12px', background: '#141414', minHeight: '100vh' }}>
          <h3 style={{ color: '#ff4444' }}>⚠️ Render Error</h3>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', marginTop: '10px' }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="color:red;padding:20px">ERROR: #root element not found!</div>'
} else {
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
