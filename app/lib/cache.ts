import type { PhotoData, DistrictStats } from '@/app/types'

const DB_NAME = 'mapbingo'
const DB_VERSION = 1
const STORE_NAME = 'cache'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function saveCache(photos: PhotoData[], stats: DistrictStats[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put(photos, 'photos')
  store.put(stats, 'districtStats')
  return new Promise((resolve) => { tx.oncomplete = () => { db.close(); resolve() } })
}

export async function loadCache(): Promise<{ photos: PhotoData[]; stats: DistrictStats[] } | null> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const photos = await idbGet<PhotoData[]>(store, 'photos')
  const stats = await idbGet<DistrictStats[]>(store, 'districtStats')
  db.close()
  if (!photos || !stats || stats.length === 0) return null
  return { photos, stats }
}

export async function clearCache(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  return new Promise((resolve) => { tx.oncomplete = () => { db.close(); resolve() } })
}

export function isCacheEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('mapbingo-cache') === 'on'
}

export function setCacheEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('mapbingo-cache', 'on')
  } else {
    localStorage.removeItem('mapbingo-cache')
  }
}
