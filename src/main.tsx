import './lib/i18n';
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Ensure your global styles are imported
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx' // Adjust path if needed
import { Toaster } from './components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <App />
      </Suspense>
      <Toaster position="bottom-right" richColors closeButton />
    </ThemeProvider>
  </StrictMode>,
)
