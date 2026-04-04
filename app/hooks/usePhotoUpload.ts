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
  const { setStatus, setProgress, setParseResult, setDistrictStats, setEmptyFolderWarning, reset } = useAppStore()

  const startParsing = useCallback((files: File[]) => {
    // HEIC / HEIF 포함 전체 중 지원 형식만 필터
    const supported = files.filter(isSupportedImage)
    const total = files.length

    if (total === 0) return

    // 이전 Worker 종료
    workerRef.current?.terminate()
    reset()
    setStatus('parsing')
    setProgress(0, total)

    // new URL() → Next.js(webpack5)가 worker 파일을 자동으로 번들
    const worker = new Worker(
      new URL('../workers/exif.worker.ts', import.meta.url)
    )
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setProgress(msg.processed, msg.total)
      } else if (msg.type === 'result') {
        // GeoJSON 매핑 (메인 스레드, bbox 최적화로 충분히 빠름)
        loadGeoJSON().then(() => {
          const mapped: PhotoData[] = msg.photos.map((p) => {
            const district = findDistrict(p.lat, p.lng)
            return district
              ? { ...p, districtCode: district.code, districtName: district.name, sidoName: district.sidoName }
              : p
          })
          const stats = aggregateStats(mapped)
          setParseResult(mapped, msg.skippedHeic, msg.skippedNoGps)
          setDistrictStats(stats)
          console.log('[MapBingo] DistrictStats:', stats)
        })
        worker.terminate()
      } else if (msg.type === 'error') {
        setStatus('error')
        worker.terminate()
      }
    }

    worker.onerror = () => {
      setStatus('error')
      worker.terminate()
    }

    // Worker에는 전체 파일 목록 전달 (Worker 내부에서 HEIC 스킵)
    worker.postMessage({ type: 'parse', files })
  }, [reset, setStatus, setProgress, setParseResult, setDistrictStats])

  // 드래그앤드롭 핸들러
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const items = Array.from(e.dataTransfer.items)
    const files: File[] = []

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        const collected = await collectFiles(entry)
        files.push(...collected)
      }
    }

    if (files.length > 0) {
      startParsing(files)
    } else {
      setEmptyFolderWarning(true)
      setTimeout(() => setEmptyFolderWarning(false), 3000)
    }
  }, [startParsing, setEmptyFolderWarning])

  // showDirectoryPicker (PC Chrome / Android Chrome)
  const onSelectFolder = useCallback(async () => {
    try {
      // @ts-expect-error showDirectoryPicker는 타입 정의가 아직 실험적
      const dirHandle = await window.showDirectoryPicker()
      const files: File[] = []

      for await (const [, entry] of dirHandle) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          files.push(file)
        }
      }

      if (files.length > 0) {
        startParsing(files)
      } else {
        setEmptyFolderWarning(true)
        setTimeout(() => setEmptyFolderWarning(false), 3000)
      }
    } catch {
      // 사용자가 취소한 경우 — 아무것도 안 함
    }
  }, [startParsing, setEmptyFolderWarning])

  return { onDrop, onSelectFolder, startParsing }
}
