'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useAppStore } from '@/app/store/useAppStore'
import { loadGeoJSON } from '@/app/lib/geoMapping'
import { FILL_COLOR_EXPRESSION } from '@/app/lib/colorScale'
import type { FeatureCollection } from 'geojson'

const SOURCE_ID = 'districts'
const FILL_LAYER_ID = 'districts-fill'
const OUTLINE_LAYER_ID = 'districts-outline'

export function useMapDistricts(map: maplibregl.Map | null) {
  const { districtStats } = useAppStore()
  const baseGeoJsonRef = useRef<FeatureCollection | null>(null)
  const layersReadyRef = useRef(false)

  // ── 지도 로드 후 GeoJSON 소스 + 레이어 추가 ──────────────────
  useEffect(() => {
    if (!map) return

    const addLayers = async () => {
      try {
        const geojson = await loadGeoJSON()
        baseGeoJsonRef.current = geojson

        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, { type: 'geojson', data: geojson })

          map.addLayer({
            id: FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            paint: {
              'fill-color': FILL_COLOR_EXPRESSION as maplibregl.ExpressionSpecification,
              'fill-opacity': 0.8,
            },
          })

          map.addLayer({
            id: OUTLINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 0.5,
              'line-opacity': 0.6,
            },
          })
        }

        layersReadyRef.current = true
      } catch {
        // GeoJSON 로드 실패 시 지도만 표시
      }
    }

    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      map.on('load', addLayers)
    }

    return () => { map.off('load', addLayers) }
  }, [map])

  // ── districtStats 변경 시 GeoJSON 데이터 직접 업데이트 ───────
  useEffect(() => {
    if (!map || !layersReadyRef.current || !baseGeoJsonRef.current) return

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

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(updated)
  }, [map, districtStats])
}
