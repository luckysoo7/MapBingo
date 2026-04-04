/**
 * Sprint 4 Evaluator 테스트
 * IndexedDB 캐싱 + 첫 화면 UX 검증
 */

import { test, expect } from '@playwright/test'

const MOCK_STATS = [
  {
    code: '11140',
    name: '마포구',
    sidoName: '서울특별시',
    visitDays: 5,
    photoCount: 12,
    firstVisit: '2024-01-15',
    lastVisit: '2024-06-20',
  },
]

const MOCK_PHOTOS = [
  {
    id: 'test1.jpg',
    lat: 37.5665,
    lng: 126.978,
    date: '2024-01-15',
    districtCode: '11140',
    districtName: '마포구',
    sidoName: '서울특별시',
  },
]

// ── 회귀 방지: 캔버스 높이 ──────────────────────────────────────
test('캔버스 높이가 600px 이상이다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)
  const h = await page.locator('canvas').evaluate((el) => el.getBoundingClientRect().height)
  expect(h).toBeGreaterThan(600)
})

// ── 기준: 첫 방문 시 오버레이 표시 ─────────────────────────────
test('첫 방문 시 (캐시 없음) 업로드 오버레이가 표시된다', async ({ page }) => {
  // IndexedDB와 localStorage 초기화
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('snaproute-cache')
    indexedDB.deleteDatabase('snaproute')
  })

  await page.reload()
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  await expect(page.getByText('사진 폴더를 드래그해서 놓으세요')).toBeVisible()
})

// ── 기준: 캐시 저장 → 리로드 → 복원 ────────────────────────────
test('IndexedDB에 데이터 저장 후 리로드하면 오버레이 없이 지도 복원된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  // localStorage 캐시 활성화 (새 방식: 'on' 값이 있어야 활성화)
  await page.evaluate(() => { localStorage.setItem('snaproute-cache', 'on') })

  // mock 데이터를 스토어에 넣고 IndexedDB에 저장
  await page.evaluate(({ photos, stats }) => {
    const store = window.__snaprouteStore?.getState()
    if (!store) throw new Error('Store not found')
    store.setParseResult(photos, 0, 0)
    store.setDistrictStats(stats)

    // IndexedDB에 직접 저장
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('snaproute', 1)
      req.onupgradeneeded = () => { req.result.createObjectStore('cache') }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('cache', 'readwrite')
        tx.objectStore('cache').put(photos, 'photos')
        tx.objectStore('cache').put(stats, 'districtStats')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, { photos: MOCK_PHOTOS, stats: MOCK_STATS })

  // 리로드
  await page.reload()
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(3_000)

  // 오버레이가 없어야 함 (status === 'done')
  await expect(page.getByText('사진 폴더를 드래그해서 놓으세요')).not.toBeVisible({ timeout: 5_000 })
})

// ── 기준: 캐시 off → 리로드 → 오버레이 표시 ────────────────────
test('캐시 off 상태에서 리로드하면 오버레이가 표시된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  // 캐시 비활성화 (새 방식: 키 없으면 OFF)
  await page.evaluate(() => { localStorage.removeItem('snaproute-cache') })

  // IndexedDB에 데이터가 있더라도 복원하지 않아야 함
  await page.evaluate(({ photos, stats }) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('snaproute', 1)
      req.onupgradeneeded = () => { req.result.createObjectStore('cache') }
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('cache', 'readwrite')
        tx.objectStore('cache').put(photos, 'photos')
        tx.objectStore('cache').put(stats, 'districtStats')
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, { photos: MOCK_PHOTOS, stats: MOCK_STATS })

  await page.reload()
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(3_000)

  // 오버레이가 다시 보여야 함
  await expect(page.getByText('사진 폴더를 드래그해서 놓으세요')).toBeVisible({ timeout: 5_000 })

  // 정리 (기본값 OFF이므로 키 제거)
  await page.evaluate(() => { localStorage.removeItem('snaproute-cache') })
})
