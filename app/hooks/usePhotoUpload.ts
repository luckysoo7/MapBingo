'use client'

import { useCallback, useRef } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { WorkerMessage, PhotoData } from '@/app/types'
import { loadGeoJSON, findDistrict, aggregateStats } from '@/app/lib/geoMapping'

// 지원 확장자
const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp'])

function isSupportedImage(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  return SUPPORTED_EXTS.has(ext)
}

// GPS 매핑: PhotoData[]에 행정구역 정보 추가
function mapPhotosToDistricts(photos: PhotoData[]): PhotoData[] {
  return photos.map((p) => {
    const district = findDistrict(p.lat, p.lng)
    return district
      ? { ...p, districtCode: district.code, districtName: district.name, sidoName: district.sidoName }
      : p
  })
}

// FileSystemEntry 재귀 순회 → File[] 반환
async function collectFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      ;(entry as FileSystemFileEntry).file((file) => resolve([file]), () => resolve([]))
    })
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    return new Promise((resolve) => {
      const results: File[] = []
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(results)
            return
          }
          for (const e of entries) {
            const files = await collectFiles(e)
            results.push(...files)
          }
          readBatch()
        })
      }
      readBatch()
    })
  }

  return []
}

export function usePhotoUpload() {
  const workerRef = useRef<Worker | null>(null)
  const allPhotosRef = useRef<PhotoData[]>([])
  const { setStatus, setProgress, setParseResult, setDistrictStats, setEmptyFolderWarning, pushDebug, reset } = useAppStore()

  const startParsing = useCallback((files: File[]) => {
    const total = files.length
    if (total === 0) return

    const supported = files.filter(isSupportedImage)
    pushDebug(`[startParsing] 전체=${total}, 지원형식=${supported.length}, 비지원=${total - supported.length}`)

    files.slice(0, 3).forEach((f, i) => {
      pushDebug(`  파일${i}: ${f.name} (${(f.size / 1024).toFixed(0)}KB, type=${f.type || 'unknown'})`)
    })

    workerRef.current?.terminate()
    allPhotosRef.current = []
    reset()
    setStatus('parsing')
    setProgress(0, total)

    // GeoJSON 선행 로딩 (Worker 결과 오기 전에 미리)
    const geoReady = loadGeoJSON()
      .then(() => { pushDebug('[geoJSON] 선행 로딩 완료') })
      .catch((err) => { pushDebug(`[geoJSON 선행 로딩 에러] ${err?.message}`) })

    const worker = new Worker(
      new URL('../workers/exif.worker.ts', import.meta.url)
    )
    workerRef.current = worker
    pushDebug('[worker] 생성 완료')

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data

      if (msg.type === 'progress') {
        setProgress(msg.processed, msg.total)

      } else if (msg.type === 'partial') {
        // 점진적 매핑: 새 GPS 사진 → 행정구역 매핑 → 지도 업데이트
        geoReady.then(() => {
          const mapped = mapPhotosToDistricts(msg.photos as PhotoData[])
          allPhotosRef.current.push(...mapped)
          const stats = aggregateStats(allPhotosRef.current)
          setDistrictStats(stats)
          pushDebug(`[partial] +${msg.photos.length}장 → 누적 GPS=${allPhotosRef.current.length}, 행정구역=${stats.length}`)
        })

      } else if (msg.type === 'result') {
        pushDebug(`[worker result] remaining=${msg.photos.length}, heic=${msg.skippedHeic}, noGps=${msg.skippedNoGps}`)

        geoReady.then(() => {
          // 남은 사진 매핑
          if (msg.photos.length > 0) {
            const mapped = mapPhotosToDistricts(msg.photos as PhotoData[])
            allPhotosRef.current.push(...mapped)
          }

          const finalPhotos = allPhotosRef.current
          const stats = aggregateStats(finalPhotos)

          pushDebug(`[최종] GPS=${finalPhotos.length}, 행정구역=${stats.length}`)
          stats.slice(0, 3).forEach((s) => {
            pushDebug(`  ${s.sidoName} ${s.name}: ${s.visitDays}일 ${s.photoCount}장`)
          })

          setParseResult(finalPhotos, msg.skippedHeic, msg.skippedNoGps)
          setDistrictStats(stats)
          pushDebug('[완료] setDistrictStats 호출됨')
        }).catch((err) => {
          pushDebug(`[geoJSON 에러] ${err?.message || String(err)}`)
          setParseResult(msg.photos as PhotoData[], msg.skippedHeic, msg.skippedNoGps)
        })

        worker.terminate()

      } else if (msg.type === 'error') {
        pushDebug(`[worker error] ${msg.message}`)
        setStatus('error')
        worker.terminate()
      }
    }

    worker.onerror = (err) => {
      pushDebug(`[worker crash] ${err.message || 'unknown'}`)
      setStatus('error')
      worker.terminate()
    }

    worker.postMessage({ type: 'parse', files })
    pushDebug('[worker] postMessage 전송')
  }, [reset, setStatus, setProgress, setParseResult, setDistrictStats, pushDebug])

  // 드래그앤드롭
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setStatus('collecting')
    pushDebug('[drop] 드래그앤드롭 시작')

    const items = Array.from(e.dataTransfer.items)
    const files: File[] = []

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        const collected = await collectFiles(entry)
        files.push(...collected)
      }
    }

    pushDebug(`[drop] 수집 완료: ${files.length}개`)
    if (files.length > 0) {
      startParsing(files)
    } else {
      setStatus('idle')
      setEmptyFolderWarning(true)
      setTimeout(() => setEmptyFolderWarning(false), 3000)
    }
  }, [startParsing, setStatus, setEmptyFolderWarning, pushDebug])

  // showDirectoryPicker (데스크톱 + Android Chrome 146+)
  const onSelectFolder = useCallback(async () => {
    try {
      pushDebug('[folder] showDirectoryPicker 호출')
      // @ts-expect-error showDirectoryPicker는 타입 정의가 아직 실험적
      const dirHandle = await window.showDirectoryPicker()
      setStatus('collecting')
      pushDebug('[folder] 폴더 선택 완료, 파일 수집 시작')

      const files: File[] = []

      for await (const [, entry] of dirHandle) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          files.push(file)
        }
      }

      pushDebug(`[folder] 수집 완료: ${files.length}개`)
      if (files.length > 0) {
        startParsing(files)
      } else {
        setStatus('idle')
        setEmptyFolderWarning(true)
        setTimeout(() => setEmptyFolderWarning(false), 3000)
      }
    } catch (err) {
      pushDebug(`[folder] 에러/취소: ${err instanceof Error ? err.message : String(err)}`)
      if (useAppStore.getState().status === 'collecting') {
        setStatus('idle')
      }
    }
  }, [startParsing, setStatus, setEmptyFolderWarning, pushDebug])

  return { onDrop, onSelectFolder, startParsing }
}
