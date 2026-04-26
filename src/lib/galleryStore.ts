// ── Abstract storage interface ────────────────────────────────────────────────
// All gallery UI code imports ONLY from gallery.ts (the active adapter).
// To switch from IndexedDB to Supabase, change the one re-export in gallery.ts.

export interface GalleryEntry {
  id: string
  country: string
  score: number
  createdAt: number  // Unix ms
}

export interface GalleryStore {
  /** Persist a JPEG blob with metadata. Returns the new entry id. */
  save(blob: Blob, meta: { country: string; score: number }): Promise<string>
  /** List all entries, newest first. Does NOT include the blob. */
  list(): Promise<GalleryEntry[]>
  /**
   * Resolve an entry to a displayable image URL.
   * Local adapter: creates/caches an object URL from the stored blob.
   * Remote adapter: returns a short-lived signed URL from the storage provider.
   */
  getImageUrl(id: string): Promise<string>
  /** Remove an entry and clean up any associated resources. */
  delete(id: string): Promise<void>
}
