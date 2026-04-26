import { useEffect, useState, useCallback } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
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
    <button onClick={onClick} className="flex flex-col gap-1">
      <div className="aspect-square rounded-lg overflow-hidden bg-muted w-full">
        {url
          ? <img src={url} alt={entry.country} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />
            </div>
        }
      </div>
      <p className="font-mono text-[10px] truncate text-muted-foreground px-0.5">{entry.country}</p>
    </button>
  )
}

// ── Full-screen viewer ────────────────────────────────────────────────────────

function Viewer({
  entry,
  onClose,
  onDelete,
  onStartHunting,
}: {
  entry: GalleryEntry
  onClose: () => void
  onDelete: () => void
  onStartHunting: () => void
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
    <div className="fixed inset-0 z-50 bg-[#1A1814] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-white">{entry.country}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            {Math.round(entry.score * 100)}% Match
          </div>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-6 min-h-0">
        {url
          ? <img src={url} alt={entry.country} className="max-w-full max-h-full rounded-xl object-contain" />
          : <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
        }
      </div>

      {/* Actions */}
      <div className="px-6 pb-4 pt-4 shrink-0 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full border-white/20 text-white bg-transparent hover:bg-white/10"
          onClick={() => url && shareOrDownload(url)}
          disabled={!url}
        >
          Download ↑
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full border-white/20 text-white bg-transparent hover:bg-white/10"
          onClick={() => url && shareOrDownload(url)}
          disabled={!url}
        >
          Share ↑
        </Button>
      </div>
      <div className="px-6 pb-10 shrink-0 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full border-white/20 text-white bg-transparent hover:bg-white/10"
          onClick={onStartHunting}
        >
          Start Hunting →
        </Button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="font-mono text-xs uppercase tracking-widest text-red-400/70 hover:text-red-400 disabled:opacity-40 transition-colors px-3"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ── Gallery screen ────────────────────────────────────────────────────────────

export function Gallery({
  onMenuOpen,
  onStartHunting,
}: {
  onMenuOpen: () => void
  onStartHunting: () => void
}) {
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
    <div className="flex flex-col min-h-screen px-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-12">
        <Logo />
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex items-center justify-center"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-8">
        <h1 className="text-[28px] font-bold tracking-[-0.02em]">Gallery</h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Your Maps</p>
      </div>

      {/* Content */}
      <div className="flex-1 mt-6 pb-8">
        {entries === null && (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />
          </div>
        )}
        {entries !== null && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-sm text-muted-foreground">No maps saved yet.</p>
            <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">Save an export to see it here.</p>
          </div>
        )}
        {entries !== null && entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {entries.map(entry => (
              <Thumbnail key={entry.id} entry={entry} onClick={() => setViewing(entry)} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="pb-8">
        <Button
          variant="outline"
          className="w-full font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={onStartHunting}
        >
          Start Hunting →
        </Button>
      </div>

      {viewing && (
        <Viewer
          entry={viewing}
          onClose={() => setViewing(null)}
          onDelete={handleDelete}
          onStartHunting={onStartHunting}
        />
      )}
    </div>
  )
}
