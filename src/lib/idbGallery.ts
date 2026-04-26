import type { GalleryEntry, GalleryStore } from './galleryStore'

const DB_NAME = 'pareidomap-gallery'
const DB_VERSION = 1
const STORE = 'entries'

// DB schema: object store "entries", keyPath "id", index "createdAt" for sorted listing.
// Each record: { id, blob, country, score, createdAt }

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Session-level cache: avoids creating a new object URL on every render.
const urlCache = new Map<string, string>()

async function save(blob: Blob, meta: { country: string; score: number }): Promise<string> {
  const id = crypto.randomUUID()
  const record = { id, blob, country: meta.country, score: meta.score, createdAt: Date.now() }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add(record)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

async function list(): Promise<GalleryEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).index('createdAt').getAll()
    req.onsuccess = () => {
      // newest first
      const entries: GalleryEntry[] = (req.result as Array<{ id: string; country: string; score: number; createdAt: number }>)
        .map(({ id, country, score, createdAt }) => ({ id, country, score, createdAt }))
        .reverse()
      resolve(entries)
    }
    req.onerror = () => reject(req.error)
  })
}

async function getImageUrl(id: string): Promise<string> {
  const cached = urlCache.get(id)
  if (cached) return cached

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      if (!req.result) { reject(new Error(`Gallery entry ${id} not found`)); return }
      const url = URL.createObjectURL(req.result.blob as Blob)
      urlCache.set(id, url)
      resolve(url)
    }
    req.onerror = () => reject(req.error)
  })
}

async function deleteEntry(id: string): Promise<void> {
  const cached = urlCache.get(id)
  if (cached) { URL.revokeObjectURL(cached); urlCache.delete(id) }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const idbGalleryStore: GalleryStore = { save, list, getImageUrl, delete: deleteEntry }
