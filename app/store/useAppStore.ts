import { create } from 'zustand'
import { PhotoData, DistrictStats } from '@/app/types'

type ParseStatus = 'idle' | 'parsing' | 'done' | 'error'

type AppState = {
  // 파싱 상태
  status: ParseStatus
  progress: { processed: number; total: number }
  skippedHeic: number
  skippedNoGps: number

  // 파싱 결과
  photos: PhotoData[]
  districtStats: DistrictStats[]

  // 선택된 행정구역 (통계 카드)
  selectedDistrict: DistrictStats | null

  // 액션
  setStatus: (status: ParseStatus) => void
  setProgress: (processed: number, total: number) => void
  setParseResult: (photos: PhotoData[], skippedHeic: number, skippedNoGps: number) => void
  setDistrictStats: (stats: DistrictStats[]) => void
  selectDistrict: (district: DistrictStats | null) => void
  reset: () => void
}

// Playwright 테스트에서 mock 데이터 주입용
declare global {
  interface Window { __snaprouteStore?: typeof useAppStore }
}

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  progress: { processed: 0, total: 0 },
  skippedHeic: 0,
  skippedNoGps: 0,
  photos: [],
  districtStats: [],
  selectedDistrict: null,

  setStatus: (status) => set({ status }),
  setProgress: (processed, total) => set({ progress: { processed, total } }),
  setParseResult: (photos, skippedHeic, skippedNoGps) =>
    set({ photos, skippedHeic, skippedNoGps, status: 'done' }),
  setDistrictStats: (districtStats) => set({ districtStats }),
  selectDistrict: (selectedDistrict) => set({ selectedDistrict }),
  reset: () =>
    set({
      status: 'idle',
      progress: { processed: 0, total: 0 },
      skippedHeic: 0,
      skippedNoGps: 0,
      photos: [],
      districtStats: [],
      selectedDistrict: null,
    }),
}))

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__snaprouteStore = useAppStore
}
