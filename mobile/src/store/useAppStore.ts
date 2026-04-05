import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PhotoLocation } from '../types'
import type { DistrictStat } from '../lib/geoMapping'

type Status = 'idle' | 'requesting' | 'scanning' | 'matching' | 'done' | 'error'

interface AppState {
  status: Status
  progress: { scanned: number; total: number }
  locations: PhotoLocation[]
  districtStats: DistrictStat[]
  error: string | null
  restoredFromCache: boolean

  setStatus: (status: Status) => void
  setProgress: (progress: { scanned: number; total: number }) => void
  setLocations: (locations: PhotoLocation[]) => void
  setDistrictStats: (stats: DistrictStat[]) => void
  setError: (error: string) => void
  setRestoredFromCache: (v: boolean) => void
  reset: () => void
}

const initialState = {
  status: 'idle' as Status,
  progress: { scanned: 0, total: 0 },
  locations: [],
  districtStats: [],
  error: null,
  restoredFromCache: false,
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      ...initialState,
      setStatus: status => set({ status }),
      setProgress: progress => set({ progress }),
      setLocations: locations => set({ locations }),
      setDistrictStats: districtStats => set({ districtStats }),
      setError: error => set({ status: 'error', error }),
      setRestoredFromCache: restoredFromCache => set({ restoredFromCache }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'mapbingo-cache',
      storage: createJSONStorage(() => AsyncStorage),
      // locations(최대 33K 엔트리, ~3MB)는 AsyncStorage 한도 초과 위험으로 제외
      // districtStats(최대 251개)만 저장 — 앱 재시작 후 지도 복원에 충분
      partialize: state => ({
        status: state.status === 'done' ? 'done' : 'idle',
        districtStats: state.districtStats,
      }),
      onRehydrateStorage: () => state => {
        // 캐시 복원 완료 시 플래그 세트
        if (state?.status === 'done' && state.districtStats.length > 0) {
          state.restoredFromCache = true
        }
      },
    }
  )
)
