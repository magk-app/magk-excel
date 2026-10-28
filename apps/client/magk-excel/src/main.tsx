import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const AnalystDemo = React.lazy(() => import('./demo/analyst/AnalystDemo'))
const isAnalystDemo = new URLSearchParams(window.location.search).get('demo') === 'analyst'

ReactDOM.createRoot(document.getElementById('root')!).render(
  isAnalystDemo ? (
    <React.Suspense fallback={null}>
      <AnalystDemo />
    </React.Suspense>
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ),
)

// Use contextBridge
window.ipcRenderer?.on('main-process-message', (_event, message) => {
  console.log(message)
})
