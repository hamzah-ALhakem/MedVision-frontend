// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './i18n'; // الآن هذا السطر سيعمل لأننا أنشأنا الملف
import { LanguageProvider } from './context/LanguageContext.jsx'; // 1. استيراد المزود

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>

    </BrowserRouter>
  </React.StrictMode>,
)