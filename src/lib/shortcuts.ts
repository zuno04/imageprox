import type { KeyboardShortcut } from '@/types';

/**
 * Default keyboard shortcuts
 */
export const SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'o',
    modifiers: ['ctrl'],
    description: 'shortcuts.openFiles',
    action: 'openFiles',
  },
  {
    key: 'Enter',
    modifiers: ['ctrl'],
    description: 'shortcuts.processImages',
    action: 'processImages',
  },
  {
    key: 's',
    modifiers: ['ctrl', 'shift'],
    description: 'shortcuts.downloadAll',
    action: 'downloadAll',
  },
  {
    key: 'a',
    modifiers: ['ctrl'],
    description: 'shortcuts.selectAll',
    action: 'selectAll',
  },
  {
    key: 'd',
    modifiers: ['ctrl'],
    description: 'shortcuts.deselectAll',
    action: 'deselectAll',
  },
  {
    key: 'Delete',
    modifiers: [],
    description: 'shortcuts.deleteSelected',
    action: 'deleteSelected',
  },
  {
    key: 'g',
    modifiers: ['ctrl'],
    description: 'shortcuts.toggleView',
    action: 'toggleView',
  },
  {
    key: '?',
    modifiers: [],
    description: 'shortcuts.showShortcuts',
    action: 'showShortcuts',
  },
  {
    key: 'Escape',
    modifiers: [],
    description: 'shortcuts.escape',
    action: 'escape',
  },
  {
    key: 'ArrowLeft',
    modifiers: [],
    description: 'shortcuts.navigate',
    action: 'navigatePrev',
  },
  {
    key: 'ArrowRight',
    modifiers: [],
    description: 'shortcuts.navigate',
    action: 'navigateNext',
  },
];

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.includes('ctrl')) {
    parts.push('Ctrl');
  }
  if (shortcut.modifiers?.includes('shift')) {
    parts.push('Shift');
  }
  if (shortcut.modifiers?.includes('alt')) {
    parts.push('Alt');
  }
  if (shortcut.modifiers?.includes('meta')) {
    parts.push('Cmd');
  }

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case 'ArrowLeft':
      keyDisplay = '←';
      break;
    case 'ArrowRight':
      keyDisplay = '→';
      break;
    case 'ArrowUp':
      keyDisplay = '↑';
      break;
    case 'ArrowDown':
      keyDisplay = '↓';
      break;
    case 'Escape':
      keyDisplay = 'Esc';
      break;
    case 'Delete':
      keyDisplay = 'Del';
      break;
    case 'Enter':
      keyDisplay = 'Enter';
      break;
    case ' ':
      keyDisplay = 'Space';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);
  return parts.join(' + ');
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase() &&
      event.key !== shortcut.key) {
    return false;
  }

  // Check modifiers
  const modifiers = shortcut.modifiers || [];
  const ctrlRequired = modifiers.includes('ctrl');
  const shiftRequired = modifiers.includes('shift');
  const altRequired = modifiers.includes('alt');
  const metaRequired = modifiers.includes('meta');

  // Use ctrlKey or metaKey for cross-platform compatibility
  const ctrlMatch = ctrlRequired ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
  const shiftMatch = shiftRequired ? event.shiftKey : !event.shiftKey;
  const altMatch = altRequired ? event.altKey : !event.altKey;
  const metaMatch = metaRequired ? event.metaKey : true; // Only check if required

  return ctrlMatch && shiftMatch && altMatch && (metaRequired ? metaMatch : true);
}
