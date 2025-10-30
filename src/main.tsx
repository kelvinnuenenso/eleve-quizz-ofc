import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
} else {
  console.error('Elemento #root não encontrado no DOM!');
}
