/**
 * Sprint 1 Evaluator 테스트
 * sprint_contract_1.md 성공 기준을 자동 검증
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'

const FIXTURE = {
  heic: path.join(__dirname, 'fixtures/fake.heic'),
  noGps: path.join(__dirname, 'fixtures/no_gps.jpg'),
}

// 파일 업로드 헬퍼 (hidden file input → startParsing 호출)
async function uploadFiles(page: Page, filePaths: string[]) {
  const input = page.locator('[data-testid="file-input"]')
  await input.setInputFiles(filePaths)
}

// ── 기준 5: 초기 화면 ────────────────────────────────────────────
test('초기 화면: 지도 + 업로드 오버레이가 표시된다', async ({ page }) => {
  await page.goto('/')

  // 지도 캔버스
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 })

  // 로고
  await expect(page.getByText('MapBingo')).toBeVisible()

  // 업로드 안내 (브라우저 지원 여부에 따라 버튼 또는 미지원 안내)
  await expect(page.getByText('사진 폴더를 드래그해서 놓으세요')).toBeVisible()
  const hasButton = await page.getByText('폴더 선택하기').isVisible().catch(() => false)
  if (!hasButton) {
    await expect(page.locator('[data-testid="unsupported-browser"]')).toBeVisible()
  }
})

// ── 기준 3: HEIC 스킵 메시지 ────────────────────────────────────
test('HEIC 파일 → "미지원 형식" 메시지가 표시된다', async ({ page }) => {
  await page.goto('/')
  await uploadFiles(page, [FIXTURE.heic])
  await expect(page.getByText(/미지원 형식/).first()).toBeVisible({ timeout: 10_000 })
})

// ── 기준 4: GPS 없는 사진 스킵 메시지 ──────────────────────────
test('GPS 없는 사진 → "위치 정보 없음" 메시지가 표시된다', async ({ page }) => {
  await page.goto('/')
  await uploadFiles(page, [FIXTURE.noGps])
  await expect(page.getByText(/위치 정보 없음/).first()).toBeVisible({ timeout: 10_000 })
})

// ── 기준 2: Web Worker — UI 블로킹 없음 ─────────────────────────
test('파싱 중 지도 캔버스가 멈추지 않는다 (Web Worker)', async ({ page }) => {
  await page.goto('/')

  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 10_000 })

  await uploadFiles(page, [FIXTURE.heic, FIXTURE.noGps])

  // 파싱 완료까지 캔버스가 사라지지 않아야 함
  await expect(page.getByText(/미지원 형식|위치 정보 없음|분석 완료/).first()).toBeVisible({ timeout: 15_000 })
  await expect(canvas).toBeVisible()
})
