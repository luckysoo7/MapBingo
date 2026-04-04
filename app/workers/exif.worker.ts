// Web Worker: EXIF 파싱 + GPS 추출
// Legacy parse (드래그앤드롭/테스트) + parse-batch (스트리밍 멀티 워커) 지원

import exifr from 'exifr'

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  )
}

function toKstDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

async function parseOneFile(file: File) {
  if (isHeic(file)) return 'heic' as const
  try {
    const exif = await exifr.parse(file, { gps: true, exif: true })
    if (!exif || !Number.isFinite(exif.latitude) || !Number.isFinite(exif.longitude)) {
      return 'noGps' as const
    }
    const raw = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate
    return {
      id: `${file.name}_${file.size}`,
      lat: exif.latitude,
      lng: exif.longitude,
      date: raw ? toKstDateString(new Date(raw)) : '날짜 없음',
      districtCode: '',
      districtName: '',
      sidoName: '',
    }
  } catch {
    return 'noGps' as const
  }
}

// ── Legacy: 단일 parse 요청 (드래그앤드롭, 테스트) ──
const PARTIAL_INTERVAL = 20

async function handleParse(files: File[]) {
  const photos: object[] = []
  let skippedHeic = 0
  let skippedNoGps = 0
  const total = files.length
  let lastPartialIndex = 0

  for (let i = 0; i < files.length; i++) {
    const r = await parseOneFile(files[i])
    if (r === 'heic') {
      skippedHeic++
    } else if (r === 'noGps') {
      skippedNoGps++
    } else {
      photos.push(r)
      if (photos.length - lastPartialIndex >= PARTIAL_INTERVAL) {
        self.postMessage({ type: 'partial', photos: photos.slice(lastPartialIndex) })
        lastPartialIndex = photos.length
      }
    }
    self.postMessage({ type: 'progress', processed: i + 1, total })
  }

  const remaining = photos.slice(lastPartialIndex)
  self.postMessage({ type: 'result', photos: remaining, skippedHeic, skippedNoGps })
}

// ── Batch: 스트리밍 멀티 워커용 큐 ──
const batchQueue: File[][] = []
let processingBatch = false

async function processBatchQueue() {
  processingBatch = true
  while (batchQueue.length > 0) {
    const files = batchQueue.shift()!
    const photos: object[] = []
    let skippedHeic = 0
    let skippedNoGps = 0

    for (const file of files) {
      const r = await parseOneFile(file)
      if (r === 'heic') skippedHeic++
      else if (r === 'noGps') skippedNoGps++
      else photos.push(r)
    }

    self.postMessage({
      type: 'batch-result',
      photos,
      skippedHeic,
      skippedNoGps,
      processedCount: files.length,
    })
  }
  processingBatch = false
}

// ── Message Router ──
self.onmessage = (event: MessageEvent) => {
  const msg = event.data
  if (msg.type === 'parse') {
    handleParse(msg.files)
  } else if (msg.type === 'parse-batch') {
    batchQueue.push(msg.files)
    if (!processingBatch) processBatchQueue()
  }
}
