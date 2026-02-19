import React from 'react'

// Redirect from pages.dev to custom domain
if (window.location.hostname === 'opalpdf.pages.dev') {
    window.location.replace('https://opalpdf.com' + window.location.pathname + window.location.search + window.location.hash);
}

import ReactDOM from 'react-dom/client'
import App from './App'
import GlobalErrorBoundary from './components/GlobalErrorBoundary'
import './styles/globals.css'
import './i18n'; // Import i18n configuration
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <GlobalErrorBoundary>
            <HelmetProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </HelmetProvider>
        </GlobalErrorBoundary>
    </React.StrictMode>,
)
