// src/components/layout/Header.tsx
import React from 'react';
import { ThemeToggle } from '../ui/ThemeToggle'; // Adjust path as needed

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 border-b border-border transition-colors duration-150 ease-in-out"> {/* Added transition */}
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">ImageMod</h1> {/* Shorter Title Example */}
        <ThemeToggle />
      </div>
    </header>
  );
}
