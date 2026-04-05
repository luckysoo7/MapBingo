import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import bbox from '@turf/bbox'
import { point } from '@turf/helpers'
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties, FeatureCollection } from 'geojson'
import type { PhotoLocation } from '../types'

const SIDO_MAP: Record<string, string> = {
  '11': '서울특별시', '21': '부산광역시', '22': '대구광역시',
  '23': '인천광역시', '24': '광주광역시', '25': '대전광역시',
  '26': '울산광역시', '29': '세종특별자치시', '31': '경기도',
  '32': '강원도', '33': '충청북도', '34': '충청남도',
  '35': '전라북도', '36': '전라남도', '37': '경상북도',
  '38': '경상남도', '39': '제주특별자치도',
}

type DistrictEntry = {
  code: string
  name: string
  sidoName: string
  bbox: [number, number, number, number]
  feature: Feature<Polygon | MultiPolygon, GeoJsonProperties>
}

// bbox 사전 계산 인덱스 빌드 (앱 실행 시 1회)
export function buildDistrictIndex(geojson: FeatureCollection): DistrictEntry[] {
  return geojson.features.map(f => {
    const code = String(f.properties?.code ?? '')
    return {
      code,
      name: String(f.properties?.name ?? ''),
      sidoName: SIDO_MAP[code.slice(0, 2)] ?? '',
      bbox: bbox(f) as [number, number, number, number],
      feature: f as Feature<Polygon | MultiPolygon, GeoJsonProperties>,
    }
  })
}

// 단일 GPS → 행정구역 코드 (bbox 1차 필터 → pointInPolygon)
function findDistrict(
  lat: number,
  lng: number,
  index: DistrictEntry[]
): { code: string; name: string; sidoName: string } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const pt = point([lng, lat])
  const candidates = index.filter(
    d => lng >= d.bbox[0] && lat >= d.bbox[1] && lng <= d.bbox[2] && lat <= d.bbox[3]
  )
  for (const d of candidates) {
    if (booleanPointInPolygon(pt, d.feature)) {
      return { code: d.code, name: d.name, sidoName: d.sidoName }
    }
  }
  return null
}

export interface DistrictStat {
  code: string
  name: string
  sidoName: string
  photoCount: number
}

// PhotoLocation[] → DistrictStat[] 집계
export function matchLocations(
  locations: PhotoLocation[],
  index: DistrictEntry[]
): DistrictStat[] {
  const map = new Map<string, DistrictStat>()

  const startTime = Date.now()
  for (const loc of locations) {
    const district = findDistrict(loc.latitude, loc.longitude, index)
    if (!district) continue

    const existing = map.get(district.code)
    if (existing) {
      existing.photoCount++
    } else {
      map.set(district.code, { ...district, photoCount: 1 })
    }
  }
  console.log(`[geoMapping] ${locations.length}개 매칭 완료: ${Date.now() - startTime}ms`)

  return Array.from(map.values())
}

// districtStats를 GeoJSON feature properties에 주입
export function injectStats(
  geojson: FeatureCollection,
  stats: DistrictStat[]
): FeatureCollection {
  const statMap = new Map(stats.map(s => [s.code, s.photoCount]))
  return {
    ...geojson,
    features: geojson.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        photoCount: statMap.get(String(f.properties?.code ?? '')) ?? 0,
      },
    })),
  }
}
