// 사진 1장당 파싱 결과
export type PhotoData = {
  id: string           // 파일명 기반 고유 ID
  lat: number
  lng: number
  date: string         // "2024-03-15" (KST 기준)
  districtCode: string // "11140" (시/군/구 코드)
  districtName: string // "마포구"
  sidoName: string     // "서울특별시"
}

// 지도에 표시할 행정구역별 집계 결과
export type DistrictStats = {
  code: string
  name: string
  sidoName: string
  visitDays: number    // 중복 제거한 날짜 수 (로그 스케일 색상 기준)
  photoCount: number
  firstVisit: string
  lastVisit: string
}

// Web Worker가 메인 스레드로 보내는 메시지
export type WorkerMessage =
  | { type: 'progress'; processed: number; total: number }
  | { type: 'result'; photos: PhotoData[]; skippedHeic: number; skippedNoGps: number }
  | { type: 'error'; message: string }

// 메인 스레드가 Web Worker로 보내는 메시지
export type WorkerInput = {
  type: 'parse'
  files: File[]
}
