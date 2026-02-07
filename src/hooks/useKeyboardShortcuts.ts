import { useEffect, useCallback } from 'react';
import { SHORTCUTS, matchesShortcut } from '@/lib/shortcuts';
import type { KeyboardShortcut } from '@/types';

type ActionHandler = () => void;

interface UseKeyboardShortcutsOptions {
  handlers: Partial<Record<string, ActionHandler>>;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts({
  handlers,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow escape in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of SHORTCUTS) {
        if (matchesShortcut(event, shortcut)) {
          const handler = handlers[shortcut.action];
          if (handler) {
            event.preventDefault();
            handler();
            return;
          }
        }
      }
    },
    [enabled, handlers]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Get shortcuts for display
 */
export function getShortcuts(): KeyboardShortcut[] {
  return SHORTCUTS;
}

export default useKeyboardShortcuts;
