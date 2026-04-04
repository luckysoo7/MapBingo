// Web Worker: EXIF 파싱 + GPS 추출
// 단일 exifr.parse()로 GPS + 날짜를 한 번에 추출

import exifr from 'exifr'

// HEIC/HEIF 여부 판단
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

// Date → KST 기준 "YYYY-MM-DD"
function toKstDateString(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

self.onmessage = async (event: MessageEvent) => {
  const { type, files } = event.data
  if (type !== 'parse') return

  const photos: object[] = []
  let skippedHeic = 0
  let skippedNoGps = 0
  const total: number = files.length

  for (let i = 0; i < files.length; i++) {
    const file: File = files[i]

    if (isHeic(file)) {
      skippedHeic++
      self.postMessage({ type: 'progress', processed: i + 1, total })
      continue
    }

    try {
      const exif = await exifr.parse(file, { gps: true, exif: true })

      if (!exif || exif.latitude == null || exif.longitude == null) {
        skippedNoGps++
        self.postMessage({ type: 'progress', processed: i + 1, total })
        continue
      }

      const raw = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate
      const dateStr = raw ? toKstDateString(new Date(raw)) : '날짜 없음'

      photos.push({
        id: `${file.name}_${file.size}`,
        lat: exif.latitude,
        lng: exif.longitude,
        date: dateStr,
        districtCode: '',
        districtName: '',
        sidoName: '',
      })
    } catch {
      skippedNoGps++
    }

    self.postMessage({ type: 'progress', processed: i + 1, total })
  }

  self.postMessage({ type: 'result', photos, skippedHeic, skippedNoGps })
}
