/**
 * Sprint 2 Evaluator 테스트
 * GeoJSON 매핑 + 지도 색칠 성공 기준 검증
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const FIXTURE_DIR = path.join(__dirname, 'fixtures')

async function uploadFiles(page: Page, filePaths: string[]) {
  await page.locator('[data-testid="file-input"]').setInputFiles(filePaths)
}

// ── 기준: 캔버스가 올바른 높이로 렌더링된다 ─────────────────────
test('캔버스 높이가 600px 이상이다', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(2_000) // ResizeObserver 발동 대기

  const canvasHeight = await page.locator('canvas').evaluate((el) => el.getBoundingClientRect().height)
  expect(canvasHeight).toBeGreaterThan(600)
})

// ── 기준: fill-color 표현식이 null 값에서 에러를 내지 않는다 ────
test('지도 초기 로드 시 MapLibre 타입 에러가 없다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(3_000) // GeoJSON fetch + 레이어 추가 대기

  const maplibreTypeErrors = errors.filter(e => e.includes('Expected value to be of type'))
  expect(maplibreTypeErrors).toHaveLength(0)
})

// ── 기준: GPS 없는 사진 업로드 후 MapLibre 에러 없이 지도 유지 ──
test('GPS 없는 사진 업로드 후 MapLibre 에러가 없다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(3_000)

  await uploadFiles(page, [path.join(FIXTURE_DIR, 'no_gps.jpg')])
  await expect(page.getByText(/위치 정보 없음/).first()).toBeVisible({ timeout: 10_000 })

  const maplibreTypeErrors = errors.filter(e => e.includes('Expected value to be of type'))
  expect(maplibreTypeErrors).toHaveLength(0)
})

// ── 기준: 색칠 업데이트 로그가 실제 GPS 사진 업로드 시 N>0으로 출력 ──
test('실 GPS 사진 업로드 시 색칠 업데이트 로그가 N>0으로 출력된다', async ({ page }) => {
  const realPhotoPath = path.join(FIXTURE_DIR, 'real_gps.jpg')
  if (!fs.existsSync(realPhotoPath)) {
    test.skip(true, 'real_gps.jpg 없음 — tests/fixtures/real_gps.jpg에 실 GPS 사진 복사 필요')
    return
  }

  const colorLogs: string[] = []
  page.on('console', (msg) => {
    if (msg.text().includes('색칠 업데이트')) colorLogs.push(msg.text())
  })

  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(3_000)

  await uploadFiles(page, [realPhotoPath])
  await expect(page.getByText(/분석 완료/)).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(1_000)

  // 색칠 업데이트가 최소 1번, 0이 아닌 행정구역 수로 기록돼야 함
  const nonZeroUpdate = colorLogs.some(log => {
    const match = log.match(/색칠 업데이트: (\d+)/)
    return match && parseInt(match[1]) > 0
  })
  expect(nonZeroUpdate).toBe(true)
})

// ── 기준: 성능 ────────────────────────────────────────────────────
test('성능: 업로드 완료 메시지가 15초 이내에 나타난다', async ({ page }) => {
  await page.goto('/')
  await uploadFiles(page, [
    path.join(FIXTURE_DIR, 'no_gps.jpg'),
    path.join(FIXTURE_DIR, 'fake.heic'),
  ])
  await expect(
    page.getByText(/분석 완료|위치 정보 없음|미지원 형식/).first()
  ).toBeVisible({ timeout: 15_000 })
})
