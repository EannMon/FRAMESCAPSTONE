import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './utils/api.js' // Global axios config: timeout, baseURL, error interceptors
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
