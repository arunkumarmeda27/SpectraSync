import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SpectraSync render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050914', color: '#f8fafc', padding: '2rem' }}>
          <section style={{ maxWidth: 520, border: '1px solid #24365f', borderRadius: 10, padding: '2rem', background: '#0b1428' }}>
            <h1 style={{ marginTop: 0 }}>Signal view could not be rendered</h1>
            <p style={{ color: '#94a3b8' }}>The analysis completed, but this view received unexpected result data.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload workstation</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
