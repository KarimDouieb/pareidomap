import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { galleryStore } from '@/lib/gallery'

export function Export({
  blob,
  match,
  onBack,
  onMenuOpen,
}: {
  blob: Blob
  match: { country: string; score: number }
  onBack: () => void
  onMenuOpen: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [galleryState, setGalleryState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  async function handleShare() {
    setSharing(true)
    try {
      const file = new File([blob], 'pareidomap.jpg', { type: 'image/jpeg' })
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        triggerDownload(blob)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') triggerDownload(blob)
    } finally {
      setSharing(false)
    }
  }

  function handleSave() {
    setSaving(true)
    triggerDownload(blob)
    setTimeout(() => setSaving(false), 1000)
  }

  async function handleSaveToGallery() {
    if (galleryState !== 'idle') return
    setGalleryState('saving')
    try {
      await galleryStore.save(blob, { country: match.country, score: match.score })
      setGalleryState('saved')
    } catch {
      setGalleryState('idle')
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6">
      {/* Top bar */}
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

      {/* Preview */}
      <div className="mt-6">
        <div className="w-full rounded-xl overflow-hidden bg-muted" style={{ aspectRatio: '1/1' }}>
          {previewUrl
            ? <img src={previewUrl} alt="Export preview" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />
              </div>
          }
        </div>
      </div>

      {/* Match info */}
      <div className="mt-4">
        <div className="text-[22px] font-bold tracking-[-0.02em]">{match.country}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          Score {match.score}% · {Math.round(blob.size / 1024)} KB
        </div>
      </div>

      {/* Gallery status */}
      <div className="mt-3">
        {galleryState === 'saved' ? (
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Saved in Gallery ✓
          </p>
        ) : (
          <button
            onClick={handleSaveToGallery}
            disabled={galleryState !== 'idle'}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {galleryState === 'saving' ? 'Saving…' : 'Save to Gallery →'}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-auto pt-6 pb-4">
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saved ✓' : 'Download ↑'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-mono uppercase tracking-widest text-xs rounded-full"
          onClick={handleShare}
          disabled={sharing}
        >
          {sharing ? 'Opening…' : 'Share ↑'}
        </Button>
      </div>

      {/* Back */}
      <div className="pb-8">
        <button
          onClick={onBack}
          className="w-full text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-2"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pareidomap.jpg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
