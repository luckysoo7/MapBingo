'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore } from '@/app/store/useAppStore'
import { loadGeoJSON } from '@/app/lib/geoMapping'
import { FILL_COLOR_EXPRESSION } from '@/app/lib/colorScale'
import type { FeatureCollection } from 'geojson'

const SOURCE_ID = 'districts'

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const baseGeoJsonRef = useRef<FeatureCollection | null>(null)
  const [layersReady, setLayersReady] = useState(false)

  // Zustand에서 districtStats 직접 구독
  const districtStats = useAppStore((s) => s.districtStats)

  // ── 지도 생성 (한 번만) ─────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const m = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ''}`,
      center: [127.7, 36.5],
      zoom: 6,
      minZoom: 5,
      maxZoom: 14,
    })

    m.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = m

    // 컨테이너 크기가 확정된 뒤 resize 호출 (height:300 버그 방지)
    const ro = new ResizeObserver(() => { m.resize() })
    ro.observe(containerRef.current!)

    // WebGL Context Loss 복구 (Android Chrome: 파일 선택기 열면 GPU 리소스 회수됨)
    const canvas = m.getCanvas()
    const onContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('[MapBingo] WebGL context lost')
    }
    const onContextRestored = () => {
      console.log('[MapBingo] WebGL context restored')
      m.triggerRepaint()
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    // 탭 복귀 시 강제 리페인트 (파일 선택기에서 돌아올 때 흰 화면 방지)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mapRef.current) {
        mapRef.current.resize()
        mapRef.current.triggerRepaint()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    m.on('load', async () => {
      try {
        const geojson = await loadGeoJSON()
        baseGeoJsonRef.current = geojson

        m.addSource(SOURCE_ID, { type: 'geojson', data: geojson })

        m.addLayer({
          id: 'districts-fill',
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': FILL_COLOR_EXPRESSION as maplibregl.ExpressionSpecification,
            'fill-opacity': 0.8,
          },
        })

        m.addLayer({
          id: 'districts-outline',
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 0.5,
            'line-opacity': 0.7,
          },
        })

        m.addLayer({
          id: 'districts-label',
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 7,
          filter: ['>', ['coalesce', ['get', 'visitDays'], 0], 0],
          layout: {
            'text-field': ['to-string', ['get', 'visitDays']],
            'text-size': 13,
            'text-font': ['Noto Sans Bold'],
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': '#1B5E20',
            'text-halo-width': 1.5,
          },
        })

        // 클릭 → 통계 카드
        m.on('click', 'districts-fill', (e) => {
          const feature = e.features?.[0]
          if (!feature) return
          const code = String(feature.properties?.code)
          const store = useAppStore.getState()
          const stats = store.districtStats.find((s) => s.code === code)
          if (stats && stats.visitDays > 0) {
            store.selectDistrict(stats)
          }
        })

        // 방문 지역 위 커서 → pointer
        m.on('mouseenter', 'districts-fill', () => { m.getCanvas().style.cursor = 'pointer' })
        m.on('mouseleave', 'districts-fill', () => { m.getCanvas().style.cursor = '' })

        setLayersReady(true)
        console.log('[MapBingo] GeoJSON 레이어 로드 완료')
      } catch (e) {
        console.error('[MapBingo] GeoJSON 로드 실패:', e)
      }
    })

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      ro.disconnect()
      m.remove()
      mapRef.current = null
      setLayersReady(false)
      baseGeoJsonRef.current = null
    }
  }, [])

  // ── districtStats 변경 시 지도 색칠 ────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !layersReady || !baseGeoJsonRef.current) return

    const statsMap = new Map(districtStats.map((s) => [s.code, s.visitDays]))

    const updated: FeatureCollection = {
      ...baseGeoJsonRef.current,
      features: baseGeoJsonRef.current.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          visitDays: statsMap.get(String(f.properties?.code)) ?? 0,
        },
      })),
    }

    const source = mapRef.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(updated)
    console.log('[MapBingo] 색칠 업데이트:', districtStats.length, '개 행정구역')
  }, [districtStats, layersReady])

  return <div ref={containerRef} className="w-full h-full" />
}
