/**
 * Sprint 5 Evaluator 테스트
 * 모바일 반응형 + 엣지 케이스 검증
 */

import { test, expect } from '@playwright/test'

// 모바일 뷰포트
const MOBILE = { width: 390, height: 844 }

// ── 회귀 방지: 캔버스 높이 ──────────────────────────────────────
test('캔버스 높이가 600px 이상이다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)
  const h = await page.locator('canvas').evaluate((el) => el.getBoundingClientRect().height)
  expect(h).toBeGreaterThan(600)
})

// ── 모바일: UploadOverlay가 뷰포트 안에 완전히 보임 ─────────────
test('모바일에서 UploadOverlay 카드가 뷰포트 안에 있다', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  const card = page.locator('[data-testid="file-input"]').locator('..')
  const box = await card.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, right: r.right, width: r.width }
  })
  expect(box.left).toBeGreaterThanOrEqual(0)
  expect(box.right).toBeLessThanOrEqual(MOBILE.width)
  expect(box.width).toBeLessThan(MOBILE.width)
})

// ── 모바일: "드래그해서 놓으세요" 텍스트가 보이지 않음 ───────────
test('모바일에서 드래그 안내 텍스트가 숨겨져 있다', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  await expect(page.getByText('사진 폴더를 드래그해서 놓으세요')).not.toBeVisible()
  await expect(page.getByText('사진 폴더를 선택하세요')).toBeVisible()
})

// ── 모바일: StatsCard가 하단 전체 너비로 표시됨 ─────────────────
test('모바일에서 StatsCard가 하단 전체 너비로 표시된다', async ({ page }) => {
  await page.setViewportSize(MOBILE)
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  // mock 데이터로 StatsCard 표시
  await page.evaluate(() => {
    window.__mapbingoStore?.getState().selectDistrict({
      code: '11140', name: '마포구', sidoName: '서울특별시',
      visitDays: 5, photoCount: 10, firstVisit: '2024-01-01', lastVisit: '2024-03-15'
    })
  })

  const card = page.locator('[data-testid="stats-card"]')
  await expect(card).toBeVisible()

  const w = await card.evaluate((el) => el.getBoundingClientRect().width)
  expect(w).toBeGreaterThanOrEqual(MOBILE.width - 2) // border 오차 허용
})

// ── 미지원 브라우저 안내 표시 ────────────────────────────────────
test('showDirectoryPicker 미지원 시 안내 메시지가 표시된다', async ({ page }) => {
  await page.addInitScript(() => {
    // showDirectoryPicker 제거하여 미지원 환경 시뮬레이션
    delete (window as Record<string, unknown>)['showDirectoryPicker']
  })
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  await expect(page.locator('[data-testid="unsupported-browser"]')).toBeVisible()
  await expect(page.getByText('Chrome 브라우저를 사용해 주세요')).toBeVisible()
})

// ── GPS 없는 사진만 업로드 시 안내 메시지 ────────────────────────
test('GPS 없는 사진만 업로드하면 안내 메시지가 표시된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000)

  await page.locator('[data-testid="file-input"]').setInputFiles('tests/fixtures/no_gps.jpg')
  await expect(page.locator('[data-testid="no-gps-warning"]')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('GPS 정보가 있는 사진을 찾지 못했습니다')).toBeVisible()
})
