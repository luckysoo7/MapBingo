import { create } from 'zustand'
import { PhotoData, DistrictStats } from '@/app/types'

type ParseStatus = 'idle' | 'collecting' | 'parsing' | 'done' | 'error'

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

  // 캐시 UX
  restoredFromCache: boolean
  savePromptDismissed: boolean

  // 엣지 케이스 경고
  emptyFolderWarning: boolean

  // 액션
  setStatus: (status: ParseStatus) => void
  setProgress: (processed: number, total: number) => void
  setParseResult: (photos: PhotoData[], skippedHeic: number, skippedNoGps: number) => void
  setDistrictStats: (stats: DistrictStats[]) => void
  selectDistrict: (district: DistrictStats | null) => void
  setRestoredFromCache: (v: boolean) => void
  dismissSavePrompt: () => void
  setEmptyFolderWarning: (v: boolean) => void
  reset: () => void
}

// Playwright 테스트에서 mock 데이터 주입용
declare global {
  interface Window { __mapbingoStore?: typeof useAppStore }
}

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  progress: { processed: 0, total: 0 },
  skippedHeic: 0,
  skippedNoGps: 0,
  photos: [],
  districtStats: [],
  selectedDistrict: null,
  restoredFromCache: false,
  savePromptDismissed: false,
  emptyFolderWarning: false,

  setStatus: (status) => set({ status }),
  setProgress: (processed, total) => set({ progress: { processed, total } }),
  setParseResult: (photos, skippedHeic, skippedNoGps) =>
    set({ photos, skippedHeic, skippedNoGps, status: 'done' }),
  setDistrictStats: (districtStats) => set({ districtStats }),
  selectDistrict: (selectedDistrict) => set({ selectedDistrict }),
  setRestoredFromCache: (restoredFromCache) => set({ restoredFromCache }),
  dismissSavePrompt: () => set({ savePromptDismissed: true }),
  setEmptyFolderWarning: (emptyFolderWarning) => set({ emptyFolderWarning }),
  reset: () =>
    set({
      status: 'idle',
      progress: { processed: 0, total: 0 },
      skippedHeic: 0,
      skippedNoGps: 0,
      photos: [],
      districtStats: [],
      selectedDistrict: null,
      restoredFromCache: false,
      savePromptDismissed: false,
      emptyFolderWarning: false,
    }),
}))

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__mapbingoStore = useAppStore
}
