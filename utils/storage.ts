import { HistoryItem } from '../types';

const DB_NAME = 'ReadersEarDB';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'readers_ear_history';

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Save audio blob to IndexedDB
 */
export const saveAudioBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get audio blob from IndexedDB
 */
export const getAudioBlob = async (id: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as Blob || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete audio blob from IndexedDB
 */
export const deleteAudioBlob = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save history items metadata to localStorage.
 * NOTE: This does NOT save the audioUrl (blob URLs are transient).
 * It relies on 'hasAudio' flag to know if it should fetch from IDB on reload.
 */
export const saveHistoryToLocal = (items: HistoryItem[]) => {
  try {
    const serialized = items.map(item => ({
      ...item,
      audioUrl: null // Never save blob URLs to localStorage
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.error("Failed to save history to localStorage", e);
  }
};

/**
 * Load history metadata from localStorage.
 */
export const loadHistoryFromLocal = (): HistoryItem[] | null => {
  try {
    const json = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to load history from localStorage", e);
    return null;
  }
};