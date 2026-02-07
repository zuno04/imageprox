import { get, set, del, keys } from 'idb-keyval';
import type { HistoryEntry, ProcessingOptions, SessionStats } from '@/types';

const HISTORY_KEY_PREFIX = 'history_';
const MAX_HISTORY_ENTRIES = 20;

/**
 * Save a history entry
 */
export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  try {
    // Get all history keys
    const allKeys = await keys();
    const historyKeys = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(HISTORY_KEY_PREFIX)
    ) as string[];

    // Remove oldest entries if we exceed the limit
    if (historyKeys.length >= MAX_HISTORY_ENTRIES) {
      // Sort by timestamp (oldest first)
      const entries = await Promise.all(
        historyKeys.map(async (key) => ({
          key,
          entry: await get<HistoryEntry>(key),
        }))
      );

      entries.sort((a, b) => (a.entry?.timestamp || 0) - (b.entry?.timestamp || 0));

      // Delete oldest entries
      const toDelete = entries.slice(0, entries.length - MAX_HISTORY_ENTRIES + 1);
      await Promise.all(toDelete.map(({ key }) => del(key)));
    }

    // Save the new entry
    await set(`${HISTORY_KEY_PREFIX}${entry.id}`, entry);
  } catch (error) {
    console.error('Error saving history entry:', error);
  }
}

/**
 * Get all history entries sorted by timestamp (newest first)
 */
export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const allKeys = await keys();
    const historyKeys = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(HISTORY_KEY_PREFIX)
    ) as string[];

    const entries = await Promise.all(
      historyKeys.map(async (key) => get<HistoryEntry>(key))
    );

    // Filter out undefined entries and sort by timestamp (newest first)
    return entries
      .filter((entry): entry is HistoryEntry => entry !== undefined)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting history entries:', error);
    return [];
  }
}

/**
 * Get a single history entry by ID
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  try {
    return await get<HistoryEntry>(`${HISTORY_KEY_PREFIX}${id}`);
  } catch (error) {
    console.error('Error getting history entry:', error);
    return undefined;
  }
}

/**
 * Delete a history entry
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  try {
    await del(`${HISTORY_KEY_PREFIX}${id}`);
  } catch (error) {
    console.error('Error deleting history entry:', error);
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    const allKeys = await keys();
    const historyKeys = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(HISTORY_KEY_PREFIX)
    ) as string[];

    await Promise.all(historyKeys.map((key) => del(key)));
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

/**
 * Create a history entry from processing results
 */
export function createHistoryEntry(
  filesCount: number,
  options: ProcessingOptions,
  stats: SessionStats
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    filesCount,
    options,
    stats,
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Older - show full date
  return date.toLocaleDateString();
}
