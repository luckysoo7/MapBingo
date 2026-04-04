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
  const { setStatus, setProgress, setParseResult, setDistrictStats, setEmptyFolderWarning, pushDebug, reset } = useAppStore()

  const startParsing = useCallback((files: File[]) => {
    const total = files.length
    if (total === 0) return

    const supported = files.filter(isSupportedImage)
    pushDebug(`[startParsing] 전체=${total}, 지원형식=${supported.length}, 비지원=${total - supported.length}`)

    // 파일 정보 샘플 (첫 3개)
    files.slice(0, 3).forEach((f, i) => {
      pushDebug(`  파일${i}: ${f.name} (${(f.size / 1024).toFixed(0)}KB, type=${f.type || 'unknown'})`)
    })

    // 이전 Worker 종료
    workerRef.current?.terminate()
    reset()
    setStatus('parsing')
    setProgress(0, total)

    const worker = new Worker(
      new URL('../workers/exif.worker.ts', import.meta.url)
    )
    workerRef.current = worker
    pushDebug('[worker] 생성 완료')

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setProgress(msg.processed, msg.total)
      } else if (msg.type === 'result') {
        pushDebug(`[worker result] GPS=${msg.photos.length}, heic=${msg.skippedHeic}, noGps=${msg.skippedNoGps}`)

        // GPS 사진 샘플 (첫 2개)
        msg.photos.slice(0, 2).forEach((p, i) => {
          pushDebug(`  GPS${i}: lat=${p.lat}, lng=${p.lng}, date=${p.date}`)
        })

        pushDebug('[geoJSON] 로딩 시작')
        loadGeoJSON()
          .then(() => {
            pushDebug('[geoJSON] 로딩 완료, 매핑 시작')
            const mapped: PhotoData[] = msg.photos.map((p) => {
              const district = findDistrict(p.lat, p.lng)
              return district
                ? { ...p, districtCode: district.code, districtName: district.name, sidoName: district.sidoName }
                : p
            })
            const withDistrict = mapped.filter((p) => p.districtCode)
            pushDebug(`[매핑] 전체=${mapped.length}, 행정구역매칭=${withDistrict.length}, 미매칭=${mapped.length - withDistrict.length}`)

            const stats = aggregateStats(mapped)
            pushDebug(`[통계] ${stats.length}개 행정구역`)
            stats.slice(0, 3).forEach((s) => {
              pushDebug(`  ${s.sidoName} ${s.name}: ${s.visitDays}일 ${s.photoCount}장`)
            })

            setParseResult(mapped, msg.skippedHeic, msg.skippedNoGps)
            setDistrictStats(stats)
            pushDebug('[완료] setDistrictStats 호출됨')
          })
          .catch((err) => {
            pushDebug(`[geoJSON 에러] ${err?.message || String(err)}`)
            // GeoJSON 실패해도 파싱 결과는 저장
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

  // 드래그앤드롭 핸들러
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

  // showDirectoryPicker (데스크톱 Chrome)
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
