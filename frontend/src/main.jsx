import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ChalkboardTestPage from './ChalkboardTestPage.jsx'

const showChalkboardTest = window.location.search.includes('chalkboardTest');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showChalkboardTest ? <ChalkboardTestPage /> : <App />}
  </StrictMode>,
)
