import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// allow absolute-like imports via @ alias in vite config

const container = document.getElementById('root')!
createRoot(container).render(<App />)
