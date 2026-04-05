import { useState, useCallback } from 'react'
import * as MediaLibrary from 'expo-media-library'
import type { PhotoLocation } from '../types'

// getAssetsAsync 배치 크기 (ID 수집용)
const FETCH_BATCH = 500
// getAssetInfoAsync 동시 병렬 요청 수 (GPS 조회용)
const INFO_CONCURRENCY = 20

interface ScanProgress {
  scanned: number
  total: number
}

interface ScanResult {
  locations: PhotoLocation[]
  skipped: number
}

export function useMediaScan() {
  const [progress, setProgress] = useState<ScanProgress>({ scanned: 0, total: 0 })
  const [scanning, setScanning] = useState(false)

  const scan = useCallback(async (): Promise<ScanResult> => {
    setScanning(true)
    setProgress({ scanned: 0, total: 0 })

    // Step 1: 전체 Asset ID 수집 (배치 페이지네이션)
    const allAssets: MediaLibrary.Asset[] = []
    let cursor: string | undefined = undefined

    const countResult = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 1,
    })
    const total = countResult.totalCount
    setProgress({ scanned: 0, total })

    do {
      const page = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: FETCH_BATCH,
        after: cursor,
      })
      allAssets.push(...page.assets)
      cursor = page.hasNextPage ? page.endCursor : undefined
      setProgress(prev => ({ ...prev, scanned: Math.min(allAssets.length, total) }))
    } while (cursor !== undefined)

    // Step 2: GPS 조회 — getAssetInfoAsync 병렬 처리 (INFO_CONCURRENCY씩)
    const locations: PhotoLocation[] = []
    let skipped = 0

    for (let i = 0; i < allAssets.length; i += INFO_CONCURRENCY) {
      const batch = allAssets.slice(i, i + INFO_CONCURRENCY)
      const infos = await Promise.all(batch.map(a => MediaLibrary.getAssetInfoAsync(a)))

      for (const info of infos) {
        if (info.location && info.location.latitude !== 0 && info.location.longitude !== 0) {
          locations.push({
            id: info.id,
            latitude: info.location.latitude,
            longitude: info.location.longitude,
            creationTime: info.creationTime,
          })
        } else {
          skipped++
        }
      }
    }

    setScanning(false)
    return { locations, skipped }
  }, [])

  return { scan, scanning, progress }
}
