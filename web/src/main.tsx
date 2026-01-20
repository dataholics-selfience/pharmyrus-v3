import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Pharmyrus Frontend Entry Point
 * 
 * Tech Stack:
 * - React 18 (with Concurrent Features)
 * - Vite (Lightning-fast HMR)
 * - TypeScript (Type safety)
 * - Tailwind CSS (Utility-first styling)
 * - Firebase (Auth + Firestore)
 * - TanStack Query (Data fetching)
 * 
 * Design System:
 * - Based on DESIGN_SYSTEM_SPEC_BOLT_new.pdf
 * - Minimalist functionalism
 * - zinc-50/zinc-950 core palette
 * - indigo-600 primary, emerald-600 secondary
 * - Max border-radius: 8px
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
