import { useState, useCallback, useEffect } from 'react';
import { get, set, del, keys } from 'idb-keyval';

/**
 * Hook for working with IndexedDB
 */
export function useIndexedDB<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load value from IndexedDB on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        setIsLoading(true);
        const value = await get<T>(key);
        if (value !== undefined) {
          setStoredValue(value);
        }
        setError(null);
      } catch (err) {
        console.error(`Error loading from IndexedDB (key: ${key}):`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]);

  // Save value to IndexedDB
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        await set(key, newValue);
        setStoredValue(newValue);
        setError(null);
      } catch (err) {
        console.error(`Error saving to IndexedDB (key: ${key}):`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [key, storedValue]
  );

  // Remove value from IndexedDB
  const removeValue = useCallback(async () => {
    try {
      await del(key);
      setStoredValue(initialValue);
      setError(null);
    } catch (err) {
      console.error(`Error removing from IndexedDB (key: ${key}):`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoading,
    error,
  };
}

/**
 * Hook for storing large images in IndexedDB
 */
export function useImageStorage() {
  const [isLoading, setIsLoading] = useState(false);

  const storeImage = useCallback(async (id: string, imageData: string) => {
    try {
      setIsLoading(true);
      await set(`image_${id}`, imageData);
    } catch (err) {
      console.error(`Error storing image (id: ${id}):`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getImage = useCallback(async (id: string): Promise<string | undefined> => {
    try {
      setIsLoading(true);
      return await get<string>(`image_${id}`);
    } catch (err) {
      console.error(`Error getting image (id: ${id}):`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeImage = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await del(`image_${id}`);
    } catch (err) {
      console.error(`Error removing image (id: ${id}):`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const allKeys = await keys();
      const imageKeys = allKeys.filter(
        (key) => typeof key === 'string' && key.startsWith('image_')
      );
      await Promise.all(imageKeys.map((key) => del(key)));
    } catch (err) {
      console.error('Error clearing images:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    storeImage,
    getImage,
    removeImage,
    clearImages,
    isLoading,
  };
}

export default useIndexedDB;
