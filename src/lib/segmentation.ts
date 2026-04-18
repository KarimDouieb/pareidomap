import { FilesetResolver, InteractiveSegmenter } from '@mediapipe/tasks-vision'

const CACHE_NAME = 'pareidomap-ml-v1'
const MODEL_URL = `${import.meta.env.BASE_URL}ml/magic_touch.tflite`
const WASM_PATH = `${import.meta.env.BASE_URL}ml/wasm`

let segmenter: InteractiveSegmenter | null = null

async function fetchModelWithProgress(onProgress: (p: number) => void): Promise<Blob> {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(MODEL_URL)
  if (cached) {
    onProgress(1)
    return cached.blob()
  }

  const response = await fetch(MODEL_URL)
  if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`)

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  const reader = response.body!.getReader()
  const parts: BlobPart[] = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    received += value.byteLength
    if (contentLength > 0) onProgress(received / contentLength)
  }

  const blob = new Blob(parts, { type: 'application/octet-stream' })
  await cache.put(MODEL_URL, new Response(blob))
  onProgress(1)
  return blob
}

export async function loadModel(onProgress: (progress: number) => void): Promise<void> {
  if (segmenter) return

  const blob = await fetchModelWithProgress(onProgress)
  const blobUrl = URL.createObjectURL(blob)

  try {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
    segmenter = await InteractiveSegmenter.createFromOptions(vision, {
      baseOptions: { modelAssetPath: blobUrl },
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    })
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export async function runSegmentation(
  img: HTMLImageElement,
  normX: number,
  normY: number,
): Promise<Uint8ClampedArray> {
  if (!segmenter) throw new Error('Model not loaded')

  // Bake EXIF rotation into canvas before passing to MediaPipe
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  canvas.getContext('2d')!.drawImage(img, 0, 0)

  return new Promise((resolve, reject) => {
    segmenter!.segment(
      canvas,
      { keypoint: { x: normX, y: normY } },
      (result) => {
        const masks = result.confidenceMasks
        if (!masks || masks.length === 0) { reject(new Error('No mask returned')); return }
        const float32 = masks[0].getAsFloat32Array()
        const binary = new Uint8ClampedArray(float32.length)
        for (let i = 0; i < float32.length; i++) binary[i] = float32[i] > 0.5 ? 255 : 0
        masks[0].close()
        resolve(binary)
      },
    )
  })
}
