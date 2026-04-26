import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Share2, Trash2, X } from 'lucide-react'
import { galleryStore, type GalleryEntry } from '@/lib/gallery'

function triggerDownload(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = 'pareidomap.jpg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function shareOrDownload(url: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const file = new File([blob], 'pareidomap.jpg', { type: 'image/jpeg' })
    if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      return
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
  }
  triggerDownload(url)
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

function Thumbnail({ entry, onClick }: { entry: GalleryEntry; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    galleryStore.getImageUrl(entry.id).then(u => { if (!cancelled) setUrl(u) }).catch(() => {})
    return () => { cancelled = true }
  }, [entry.id])

  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-[10px] overflow-hidden bg-muted relative group"
    >
      {url
        ? <img src={url} alt={entry.country} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />
          </div>
      }
      {/* Country label on hover/tap */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-white text-[10px] font-mono truncate">{entry.country}</p>
      </div>
    </button>
  )
}

// ── Full-screen viewer ────────────────────────────────────────────────────────

function Viewer({
  entry,
  onClose,
  onDelete,
}: {
  entry: GalleryEntry
  onClose: () => void
  onDelete: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    galleryStore.getImageUrl(entry.id).then(u => { if (!cancelled) setUrl(u) }).catch(() => {})
    return () => { cancelled = true }
  }, [entry.id])

  async function handleDelete() {
    setDeleting(true)
    await galleryStore.delete(entry.id)
    onDelete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-[10px] border border-white/20 flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white">{entry.country}</div>
          <div className="text-xs text-white/50 font-mono tracking-widest">
            {Math.round(entry.score * 100)}% MATCH
          </div>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {url
          ? <img src={url} alt={entry.country} className="max-w-full max-h-full rounded-[10px] object-contain" />
          : <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
        }
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 pb-10 pt-4 shrink-0">
        <button
          onClick={() => url && shareOrDownload(url)}
          disabled={!url}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[10px] border border-white/20 text-white text-sm disabled:opacity-40"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[10px] border border-red-500/40 text-red-400 text-sm disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ── Gallery screen ────────────────────────────────────────────────────────────

export function Gallery({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<GalleryEntry[] | null>(null)
  const [viewing, setViewing] = useState<GalleryEntry | null>(null)

  const load = useCallback(() => {
    galleryStore.list().then(setEntries).catch(() => setEntries([]))
  }, [])

  useEffect(() => { load() }, [load])

  function handleDelete() {
    setViewing(null)
    load()
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-[10px] border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">Gallery</div>
          <div className="text-xs text-muted-foreground font-mono tracking-widest">YOUR MAPS</div>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8">
        {entries === null && (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />
          </div>
        )}
        {entries !== null && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-sm text-muted-foreground">No maps saved yet.</p>
            <p className="text-xs text-muted-foreground/60">Save an export to see it here.</p>
          </div>
        )}
        {entries !== null && entries.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {entries.map(entry => (
              <Thumbnail key={entry.id} entry={entry} onClick={() => setViewing(entry)} />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen viewer overlay */}
      {viewing && (
        <Viewer
          entry={viewing}
          onClose={() => setViewing(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
