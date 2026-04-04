import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import bbox from '@turf/bbox'
import { point } from '@turf/helpers'
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties, FeatureCollection } from 'geojson'
import { PhotoData, DistrictStats } from '@/app/types'

// 시/도 코드 앞 2자리 → 시/도 이름
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

// 싱글턴 인덱스 — 앱 실행 중 한 번만 로드
let districtIndex: DistrictEntry[] | null = null
let geoJsonData: FeatureCollection | null = null

export async function loadGeoJSON(): Promise<FeatureCollection> {
  if (geoJsonData) return geoJsonData

  const res = await fetch('/districts.geojson')
  if (!res.ok) throw new Error('GeoJSON 로드 실패')

  const geojson: FeatureCollection = await res.json()

  districtIndex = geojson.features.map((f) => {
    const code = String(f.properties?.code ?? '')
    const name = String(f.properties?.name ?? '')
    const sidoName = SIDO_MAP[code.slice(0, 2)] ?? ''
    return {
      code,
      name,
      sidoName,
      bbox: bbox(f) as [number, number, number, number],
      feature: f as Feature<Polygon | MultiPolygon, GeoJsonProperties>,
    }
  })

  geoJsonData = geojson
  return geojson
}

// GPS → 행정구역 매핑 (bbox 사전 필터 → point-in-polygon)
export function findDistrict(lat: number, lng: number) {
  if (!districtIndex) return null

  const pt = point([lng, lat])

  const candidates = districtIndex.filter(
    (d) => lng >= d.bbox[0] && lat >= d.bbox[1] && lng <= d.bbox[2] && lat <= d.bbox[3]
  )

  for (const d of candidates) {
    if (booleanPointInPolygon(pt, d.feature)) {
      return { code: d.code, name: d.name, sidoName: d.sidoName }
    }
  }
  return null
}

// PhotoData[] → DistrictStats[] 집계
export function aggregateStats(photos: PhotoData[]): DistrictStats[] {
  const map = new Map<string, { name: string; sidoName: string; dates: Set<string>; count: number }>()

  for (const p of photos) {
    if (!p.districtCode) continue
    const existing = map.get(p.districtCode)
    if (existing) {
      existing.dates.add(p.date)
      existing.count++
    } else {
      map.set(p.districtCode, {
        name: p.districtName,
        sidoName: p.sidoName,
        dates: new Set([p.date]),
        count: 1,
      })
    }
  }

  return Array.from(map.entries()).map(([code, v]) => {
    const sortedDates = Array.from(v.dates).sort()
    return {
      code,
      name: v.name,
      sidoName: v.sidoName,
      visitDays: v.dates.size,
      photoCount: v.count,
      firstVisit: sortedDates[0],
      lastVisit: sortedDates[sortedDates.length - 1],
    }
  })
}
