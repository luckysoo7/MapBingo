---
paths:
  - "tests/**"
---

# Playwright Testing Rules — SnapRoute

## Canvas / Map Dimension Check (MANDATORY in every sprint)

Every sprint's first test must verify the canvas is correctly sized:

```typescript
const h = await page.locator('canvas').evaluate(el => el.getBoundingClientRect().height)
expect(h).toBeGreaterThan(600)
```

`toBeVisible()` alone is insufficient — a 300px-tall canvas passes visibility but renders nothing useful.

## Mock Data Injection (for UI tests without real GPS photos)

Expose the Zustand store in dev mode (`useAppStore.ts`):
```typescript
if (process.env.NODE_ENV !== 'production') {
  (window as any).__snaprouteStore = useAppStore
}
```

Inject mock state in tests via:
```typescript
await page.evaluate(() => {
  (window as any).__snaprouteStore?.getState().selectDistrict({
    code: '11140', name: '마포구', sidoName: '서울특별시',
    visitDays: 5, photoCount: 10, firstVisit: '2024-01-01', lastVisit: '2024-03-15'
  })
})
```

## data-testid Conventions

| Element | testid |
|---------|--------|
| Hidden file input | `file-input` |
| Stats card | `stats-card` |
| Stats card close button | `stats-card-close` |

## File Upload

```typescript
await page.locator('[data-testid="file-input"]').setInputFiles(filePaths)
```

Fixtures: `tests/fixtures/no_gps.jpg`, `tests/fixtures/fake.heic`
Real GPS fixture: `tests/fixtures/real_gps.jpg` (skip test if absent)
