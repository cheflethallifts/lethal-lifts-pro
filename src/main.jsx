import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the app in the Google Provider using your environment variable */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
      <Analytics />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)