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

// FileSystemEntry 재귀 순회 → File[] 반환 (드래그앤드롭용)
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

// 멀티 워커: CPU 코어 수 기반 (최대 4)
const WORKER_COUNT = typeof navigator !== 'undefined'
  ? Math.min(navigator.hardwareConcurrency || 2, 4)
  : 2
const BATCH_SIZE = 50

function createWorker(): Worker {
  return new Worker(new URL('../workers/exif.worker.ts', import.meta.url))
}

export function usePhotoUpload() {
  const workerRef = useRef<Worker | null>(null)
  const workersRef = useRef<Worker[]>([])
  const allPhotosRef = useRef<PhotoData[]>([])
  const { setStatus, setProgress, setCollectingCount, setParseResult, setDistrictStats, setEmptyFolderWarning, pushDebug, reset } = useAppStore()

  // ── 단일 워커 파싱 (드래그앤드롭, 테스트 인풋) ──
  const startParsing = useCallback((files: File[]) => {
    const total = files.length
    if (total === 0) return

    const supported = files.filter(isSupportedImage)
    pushDebug(`[startParsing] 전체=${total}, 지원형식=${supported.length}, 비지원=${total - supported.length}`)

    files.slice(0, 3).forEach((f, i) => {
      pushDebug(`  파일${i}: ${f.name} (${(f.size / 1024).toFixed(0)}KB, type=${f.type || 'unknown'})`)
    })

    workerRef.current?.terminate()
    workersRef.current.forEach(w => w.terminate())
    allPhotosRef.current = []
    reset()
    setStatus('parsing')
    setProgress(0, total)

    const geoReady = loadGeoJSON()
      .then(() => { pushDebug('[geoJSON] 선행 로딩 완료') })
      .catch((err) => { pushDebug(`[geoJSON 선행 로딩 에러] ${err?.message}`) })

    const worker = createWorker()
    workerRef.current = worker
    pushDebug('[worker] 생성 ��료')

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data

      if (msg.type === 'progress') {
        setProgress(msg.processed, msg.total)

      } else if (msg.type === 'partial') {
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

  // ── 드래그앤드롭 ──
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

  // ── showDirectoryPicker — 스트리밍 멀티 워커 파싱 ──
  // 파일 수집과 EXIF 파싱을 동시 진행. N개 워커가 병렬로 배치를 처리.
  const onSelectFolder = useCallback(async () => {
    try {
      pushDebug('[folder] showDirectoryPicker 호출')
      // @ts-expect-error showDirectoryPicker는 타입 정의가 아직 실험적
      const dirHandle = await window.showDirectoryPicker()

      // 기존 워커 정리
      workerRef.current?.terminate()
      workersRef.current.forEach(w => w.terminate())
      allPhotosRef.current = []
      reset()
      setStatus('collecting')
      setCollectingCount(0)

      // GeoJSON 선행 로딩
      const geoReady = loadGeoJSON()
        .then(() => { pushDebug('[geoJSON] 선행 로딩 완료') })
        .catch((err) => { pushDebug(`[geoJSON 에러] ${err?.message}`) })

      // 공유 카운터 (클로저 내 가변 상태)
      let totalDispatched = 0
      let totalProcessed = 0
      let collectionDone = false
      let skippedHeic = 0
      let skippedNoGps = 0

      const finalize = () => {
        const finalPhotos = allPhotosRef.current
        const stats = aggregateStats(finalPhotos)
        pushDebug(`[최종] GPS=${finalPhotos.length}, 행정구역=${stats.length}`)
        stats.slice(0, 3).forEach((s) => {
          pushDebug(`  ${s.sidoName} ${s.name}: ${s.visitDays}일 ${s.photoCount}장`)
        })
        setParseResult(finalPhotos, skippedHeic, skippedNoGps)
        setDistrictStats(stats)
        pushDebug('[완료] setDistrictStats 호출됨')
        workers.forEach(w => w.terminate())
        workersRef.current = []
      }

      // 워커 풀 생성
      const workerCount = WORKER_COUNT
      pushDebug(`[folder] 워커 ${workerCount}개 생성, 스트리밍 시작`)
      const workers: Worker[] = []

      for (let i = 0; i < workerCount; i++) {
        const w = createWorker()
        w.onmessage = (e: MessageEvent) => {
          const msg = e.data
          if (msg.type !== 'batch-result') return

          geoReady.then(() => {
            totalProcessed += msg.processedCount
            skippedHeic += msg.skippedHeic
            skippedNoGps += msg.skippedNoGps

            if (msg.photos.length > 0) {
              const mapped = mapPhotosToDistricts(msg.photos as PhotoData[])
              allPhotosRef.current.push(...mapped)
              const stats = aggregateStats(allPhotosRef.current)
              setDistrictStats(stats)
            }

            setProgress(totalProcessed, totalDispatched)
            pushDebug(`[batch] +${msg.photos.length}장 GPS, ${totalProcessed}/${totalDispatched}`)

            if (collectionDone && totalProcessed >= totalDispatched) {
              finalize()
            }
          })
        }
        w.onerror = (err) => {
          pushDebug(`[worker${i} crash] ${err.message || 'unknown'}`)
        }
        workers.push(w)
      }
      workersRef.current = workers

      // 스트리밍 수집 + 워커 디스패치 (수집하면서 동시에 파싱)
      let nextWorker = 0
      let batch: File[] = []
      let fileCount = 0

      for await (const [, entry] of dirHandle) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          fileCount++
          if (fileCount % 100 === 0) setCollectingCount(fileCount)
          batch.push(file)

          if (batch.length >= BATCH_SIZE) {
            if (useAppStore.getState().status === 'collecting') setStatus('parsing')
            totalDispatched += batch.length
            setProgress(totalProcessed, totalDispatched)
            workers[nextWorker].postMessage({ type: 'parse-batch', files: [...batch] })
            nextWorker = (nextWorker + 1) % workerCount
            batch = []
          }
        }
      }

      // 남은 배치 디스패치
      if (batch.length > 0) {
        if (useAppStore.getState().status === 'collecting') setStatus('parsing')
        totalDispatched += batch.length
        setProgress(totalProcessed, totalDispatched)
        workers[nextWorker].postMessage({ type: 'parse-batch', files: batch })
      }

      collectionDone = true
      pushDebug(`[folder] 수집 완료: ${fileCount}개, 디스패치=${totalDispatched}`)

      if (totalDispatched === 0) {
        setStatus('idle')
        setEmptyFolderWarning(true)
        setTimeout(() => setEmptyFolderWarning(false), 3000)
        workers.forEach(w => w.terminate())
        workersRef.current = []
        return
      }

      // 수집 완료 시점에 이미 모든 파싱 끝났을 수 있음
      if (totalProcessed >= totalDispatched) {
        finalize()
      }
    } catch (err) {
      pushDebug(`[folder] 에러/취소: ${err instanceof Error ? err.message : String(err)}`)
      if (['collecting', 'parsing'].includes(useAppStore.getState().status)) {
        setStatus('idle')
      }
    }
  }, [reset, setStatus, setProgress, setCollectingCount, setParseResult, setDistrictStats, setEmptyFolderWarning, pushDebug])

  return { onDrop, onSelectFolder, startParsing }
}
