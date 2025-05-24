// src/components/ThemeProvider.tsx
"use client" // Ensure this is present if using Next.js App Router conventions, though for Vite it's more about signaling client-side code.

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
