import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './reset.css'
import './styles.css' // paste the Figma Make index.css here (without its first @import "tailwindcss" line)
import './extra.css'

createRoot(document.getElementById('root')).render(<App />)
