import { useCallback, useEffect, useMemo } from 'react'
import {
  StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as MediaLibrary from 'expo-media-library'
import MapLibreGL from '@maplibre/maplibre-react-native'
import type { FeatureCollection } from 'geojson'

import { useMediaScan } from './src/hooks/useMediaScan'
import { useAppStore } from './src/store/useAppStore'
import { StatsCard } from './src/components/StatsCard'
import { buildDistrictIndex, matchLocations, injectStats } from './src/lib/geoMapping'
import { FILL_COLOR_EXPRESSION } from './src/lib/colorScale'

MapLibreGL.setAccessToken(null)

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
const KOREA_CENTER: [number, number] = [127.5, 36.5]

const rawGeoJson: FeatureCollection = require('./assets/districts.geojson')
const districtIndex = buildDistrictIndex(rawGeoJson)

export default function App() {
  const {
    status, progress, locations, districtStats, error, restoredFromCache,
    setStatus, setLocations, setDistrictStats, setError, setRestoredFromCache, reset,
  } = useAppStore()
  const { scan } = useMediaScan()
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions()

  // 행정구역 매칭 (scanning 완료 후)
  useEffect(() => {
    if (status !== 'matching' || locations.length === 0) return
    const stats = matchLocations(locations, districtIndex)
    setDistrictStats(stats)
    setStatus('done')
  }, [status, locations, setDistrictStats, setStatus])

  // GPS 사진이 0장인 경우 처리
  useEffect(() => {
    if (status !== 'matching' || locations.length !== 0) return
    setError('GPS 정보가 있는 사진을 찾지 못했습니다.')
  }, [status, locations, setError])

  const handleStart = useCallback(async () => {
    setStatus('requesting')
    let perm = permissionResponse
    if (!perm?.granted) perm = await requestPermission()

    if (!perm?.granted) {
      // 권한 영구 거부 → 설정 앱으로 안내
      if (perm?.canAskAgain === false) {
        setError('PERMISSION_DENIED_PERMANENTLY')
      } else {
        setError('사진 접근 권한이 필요합니다.')
      }
      return
    }

    setStatus('scanning')
    try {
      const { locations: locs } = await scan()
      setLocations(locs)
      setStatus('matching')
    } catch {
      setError('사진 스캔 중 오류가 발생했습니다.')
    }
  }, [permissionResponse, requestPermission, scan, setStatus, setLocations, setError])

  const coloredGeoJson = useMemo(() => {
    if (districtStats.length === 0) return rawGeoJson
    return injectStats(rawGeoJson, districtStats)
  }, [districtStats])

  // ── idle ──────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.title}>MapBingo</Text>
        <Text style={styles.subtitle}>내 사진으로 방문 지도 만들기</Text>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>사진 분석 시작</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── requesting ────────────────────────────────────────────
  if (status === 'requesting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.label}>권한 요청 중...</Text>
      </View>
    )
  }

  // ── scanning ──────────────────────────────────────────────
  if (status === 'scanning') {
    const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.label}>
          {progress.scanned.toLocaleString()} / {progress.total.toLocaleString()}장 분석 중...
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    )
  }

  // ── matching ──────────────────────────────────────────────
  if (status === 'matching') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D6A4F" />
        <Text style={styles.label}>방문 지역 계산 중...</Text>
      </View>
    )
  }

  // ── error ─────────────────────────────────────────────────
  if (status === 'error') {
    const isPermDenied = error === 'PERMISSION_DENIED_PERMANENTLY'
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {isPermDenied ? '사진 접근 권한이 거부되었습니다.\n설정에서 허용해주세요.' : error}
        </Text>
        {isPermDenied ? (
          <TouchableOpacity style={styles.button} onPress={() => Linking.openSettings()}>
            <Text style={styles.buttonText}>설정 열기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // ── done ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={MAP_STYLE}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          zoomLevel={5.5}
          centerCoordinate={KOREA_CENTER}
          animationDuration={0}
        />
        <MapLibreGL.ShapeSource id="districts" shape={coloredGeoJson}>
          <MapLibreGL.FillLayer
            id="districts-fill"
            style={{
              fillColor: FILL_COLOR_EXPRESSION as any,
              fillOutlineColor: '#aaa',
              fillOpacity: 0.85,
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      <StatsCard stats={districtStats} />

      {/* 캐시 복원 배지 */}
      {restoredFromCache && (
        <TouchableOpacity
          style={styles.cacheBadge}
          onPress={() => { setRestoredFromCache(false); reset() }}
        >
          <Text style={styles.cacheBadgeText}>저장된 결과 · 탭하여 재분석</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: { fontSize: 32, fontWeight: '700', color: '#1B5E20', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 40 },
  label: { marginTop: 16, fontSize: 16, color: '#333', textAlign: 'center' },
  button: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2D6A4F', borderRadius: 3 },
  pct: { marginTop: 8, fontSize: 14, color: '#888' },
  errorText: {
    fontSize: 15, color: '#c00', textAlign: 'center', marginBottom: 24, lineHeight: 22,
  },
  cacheBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(45,106,79,0.88)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cacheBadgeText: { color: '#fff', fontSize: 13, fontWeight: '500' },
})
