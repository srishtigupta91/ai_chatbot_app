import React from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot from react-dom/client
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import App from './App'; // Your main App component

// Get the root DOM element
const rootElement = document.getElementById('root');

// Create a root and render the App component
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap App with BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);