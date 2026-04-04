// Web Worker: EXIF 파싱 + GPS 추출
// 20장마다 partial 결과를 보내 지도가 점진적으로 색칠됨

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

const PARTIAL_INTERVAL = 20 // GPS 사진 N장마다 중간 결과 전송

self.onmessage = async (event: MessageEvent) => {
  const { type, files } = event.data
  if (type !== 'parse') return

  const photos: object[] = []
  let skippedHeic = 0
  let skippedNoGps = 0
  const total: number = files.length
  let lastPartialIndex = 0

  for (let i = 0; i < files.length; i++) {
    const file: File = files[i]

    if (isHeic(file)) {
      skippedHeic++
      self.postMessage({ type: 'progress', processed: i + 1, total })
      continue
    }

    try {
      const exif = await exifr.parse(file, { gps: true, exif: true })

      if (!exif || !Number.isFinite(exif.latitude) || !Number.isFinite(exif.longitude)) {
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

      // GPS 사진이 PARTIAL_INTERVAL개 쌓일 때마다 중간 결과 전송
      if (photos.length - lastPartialIndex >= PARTIAL_INTERVAL) {
        const newPhotos = photos.slice(lastPartialIndex)
        self.postMessage({ type: 'partial', photos: newPhotos })
        lastPartialIndex = photos.length
      }
    } catch {
      skippedNoGps++
    }

    self.postMessage({ type: 'progress', processed: i + 1, total })
  }

  // 최종 결과: 마지막 partial 이후 남은 사진
  const remaining = photos.slice(lastPartialIndex)
  self.postMessage({ type: 'result', photos: remaining, skippedHeic, skippedNoGps })
}
