import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { RealtimeProvider } from './context/RealtimeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RealtimeProvider>
        <App />
      </RealtimeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
