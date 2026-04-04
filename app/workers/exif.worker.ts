// Web Worker: EXIF 파싱 + GPS 추출
// 배치 단위로 파일을 받아 처리 → 메모리 폭발 방지

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

// 누적 결과
const allPhotos: object[] = []
let totalSkippedHeic = 0
let totalSkippedNoGps = 0

self.onmessage = async (event: MessageEvent) => {
  const msg = event.data

  if (msg.type === 'parse-batch') {
    const { files, totalFiles, processedBefore } = msg

    for (let i = 0; i < files.length; i++) {
      const file: File = files[i]

      if (isHeic(file)) {
        totalSkippedHeic++
        self.postMessage({ type: 'progress', processed: processedBefore + i + 1, total: totalFiles })
        continue
      }

      try {
        // GPS 좌표만 가볍게 추출 (전체 EXIF 파싱보다 훨씬 빠르고 메모리 절약)
        const gps = await exifr.gps(file)

        if (!gps || gps.latitude == null || gps.longitude == null) {
          totalSkippedNoGps++
          self.postMessage({ type: 'progress', processed: processedBefore + i + 1, total: totalFiles })
          continue
        }

        // 날짜만 별도 추출 (가볍게 필요한 태그만)
        let dateStr = '날짜 없음'
        try {
          const dateTags = await exifr.parse(file, {
            pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
          })
          const raw = dateTags?.DateTimeOriginal || dateTags?.CreateDate || dateTags?.ModifyDate
          if (raw) dateStr = toKstDateString(new Date(raw))
        } catch {
          // 날짜 파싱 실패해도 GPS는 있으니 진행
        }

        allPhotos.push({
          id: `${file.name}_${file.size}`,
          lat: gps.latitude,
          lng: gps.longitude,
          date: dateStr,
          districtCode: '',
          districtName: '',
          sidoName: '',
        })
      } catch {
        totalSkippedNoGps++
      }

      self.postMessage({ type: 'progress', processed: processedBefore + i + 1, total: totalFiles })
    }

    // 배치 완료 알림
    self.postMessage({ type: 'batch-done', photos: [], skippedHeic: 0, skippedNoGps: 0 })
  }

  if (msg.type === 'finish') {
    self.postMessage({
      type: 'result',
      photos: allPhotos,
      skippedHeic: totalSkippedHeic,
      skippedNoGps: totalSkippedNoGps,
    })
  }
}
