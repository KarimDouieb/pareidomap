// ── Active gallery adapter ─────────────────────────────────────────────────────
// All UI code imports `galleryStore` from here.
// To switch to Supabase: replace the import below with the Supabase adapter.

export { idbGalleryStore as galleryStore } from './idbGallery'
export type { GalleryEntry, GalleryStore } from './galleryStore'
