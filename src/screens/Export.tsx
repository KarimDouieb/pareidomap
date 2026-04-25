import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Export({ blob, onBack }: { blob: Blob; onBack: () => void }) {
  // URL is created inside useEffect so React StrictMode's mount→cleanup→remount
  // cycle doesn't revoke the URL before the <img> has loaded it.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [saving, setSaving] = useState(false)

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
        // Desktop / unsupported: fall back to a direct download.
        triggerDownload(blob)
      }
    } catch (e) {
      // AbortError means the user dismissed the share sheet — not a real error.
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
          <div className="text-sm font-semibold">Export</div>
          <div className="text-xs text-muted-foreground font-mono tracking-widest">SHARE OR SAVE</div>
        </div>
        {/* Spacer to balance the header */}
        <div className="w-9 h-9" />
      </div>

      {/* Full-resolution preview */}
      <div className="px-4">
        <div className="w-full rounded-[14px] overflow-hidden bg-muted flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
          {previewUrl
            ? <img src={previewUrl} alt="Export preview" className="w-full h-full object-cover" />
            : <div className="w-8 h-8 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin opacity-40" />}
        </div>
      </div>

      {/* Info line */}
      <p className="text-center text-xs text-muted-foreground font-mono mt-3 px-4">
        High-resolution JPEG · {Math.round(blob.size / 1024)} KB
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 pb-8 pt-6 mt-auto">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          <Download className="w-4 h-4" />
          {saving ? 'Saved' : 'Save'}
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={handleShare}
          disabled={sharing}
        >
          <Share2 className="w-4 h-4" />
          {sharing ? 'Opening…' : 'Share'}
        </Button>
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
