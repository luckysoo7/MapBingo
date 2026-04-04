'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { saveCache, isCacheEnabled } from '@/app/lib/cache'

export function useCacheSync() {
  const districtStats = useAppStore((s) => s.districtStats)
  const photos = useAppStore((s) => s.photos)

  useEffect(() => {
    if (districtStats.length === 0) return
    if (!isCacheEnabled()) return

    saveCache(photos, districtStats)
      .then(() => console.log('[SnapRoute] 캐시 저장 완료:', districtStats.length, '개 행정구역'))
      .catch((e) => console.error('[SnapRoute] 캐시 저장 실패:', e))
  }, [districtStats, photos])
}
