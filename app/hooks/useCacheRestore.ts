'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { loadCache, isCacheEnabled } from '@/app/lib/cache'

export function useCacheRestore() {
  const status = useAppStore((s) => s.status)

  useEffect(() => {
    if (status !== 'idle') return
    if (!isCacheEnabled()) return

    loadCache().then((cached) => {
      if (!cached) return
      const { setParseResult, setDistrictStats, setRestoredFromCache } = useAppStore.getState()
      setRestoredFromCache(true)
      setParseResult(cached.photos, 0, 0)
      setDistrictStats(cached.stats)
      console.log('[SnapRoute] 캐시 복원:', cached.stats.length, '개 행정구역')
    }).catch(() => {
      // IndexedDB 접근 실패 시 무시 — 첫 방문처럼 동작
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
