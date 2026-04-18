import { useEffect, useRef, useState } from 'react'
import { loadModel, runSegmentation } from '@/lib/segmentation'

type Status = 'idle' | 'downloading' | 'ready' | 'inferring' | 'error'

interface SegmentationState {
  status: Status
  downloadProgress: number
  mask: Uint8ClampedArray | null
  error: string | null
}

export function useSegmentation() {
  const [state, setState] = useState<SegmentationState>({
    status: 'idle',
    downloadProgress: 0,
    mask: null,
    error: null,
  })
  const loadingRef = useRef(false)

  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    setState(s => ({ ...s, status: 'downloading', downloadProgress: 0 }))
    loadModel((progress) => {
      setState(s => ({ ...s, downloadProgress: progress }))
    })
      .then(() => setState(s => ({ ...s, status: 'ready' })))
      .catch(err => setState(s => ({ ...s, status: 'error', error: String(err) })))
  }, [])

  async function segment(img: HTMLImageElement, normX: number, normY: number) {
    setState(s => ({ ...s, status: 'inferring', mask: null }))
    try {
      const mask = await runSegmentation(img, normX, normY)
      setState(s => ({ ...s, status: 'ready', mask }))
    } catch (err) {
      setState(s => ({ ...s, status: 'error', error: String(err) }))
    }
  }

  function clearMask() {
    setState(s => ({ ...s, mask: null }))
  }

  return { ...state, segment, clearMask }
}
