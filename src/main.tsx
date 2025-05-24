import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Ensure your global styles are imported
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx' // Adjust path if needed

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
)
