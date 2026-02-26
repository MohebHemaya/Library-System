/**
 * Application Entry Point
 * 
 * This is the main entry point for the Library Management System.
 * It sets up React and renders the root App component with
 * necessary providers like React Router.
 */

import React from 'react';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import global styles
import './index.css';

// Create root and render application
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);