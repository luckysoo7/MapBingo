# MapBingo — Project Map

## What Is This?

GPS EXIF photos → visited Korean administrative districts → colored map visualization.
Fully client-side. Photos never leave the browser.

## Tech Stack

```
Next.js 14 (App Router) + TypeScript + Tailwind CSS
MapLibre GL JS + MapTiler Streets-v2 (free, no CC required)
southkorea/southkorea-maps GeoJSON (251 시/군/구 districts)
exifr + @turf/boolean-point-in-polygon + @turf/bbox + Web Worker
Zustand + IndexedDB + Vercel
```

## Sprint Status — MVP Complete

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Next.js setup + EXIF engine | ✅ done (Playwright 4/4) |
| 2 | GeoJSON mapping + map coloring | ✅ done (Playwright 4/4) |
| 3 | Number labels + stats card | ✅ done (Playwright 6/6) |
| 4 | IndexedDB caching + first-run UX | ✅ done (Playwright 4/4) |
| 5 | Mobile responsive + edge cases | ✅ done (Playwright 6/6) |

All 24 Playwright tests passing.

## Key Design Decisions (current)

- Color scale (green, log): `#E8E8E8 → #C8E6C9 → #81C784 → #388E3C → #1B5E20`
- HEIC: skip + user message (MVP)
- Cache: **opt-in** via SavePrompt after analysis (default OFF, was changed from auto-ON in Sprint 4)
- TopBar: settings gear → "데이터 초기화" button (replaced cache toggle)
- Mobile: TopBar kept, no tab bar (decided in Sprint 5 — tab bar deferred to Phase 2)
- StatsCard: bottom sheet on mobile, left card on desktop
- Unsupported browser: `showDirectoryPicker` feature detection (not UA sniffing)

## Session Start Checklist

1. Read this file
2. Read `backlog.md` (deferred items for Phase 2+)

## Folder Convention

- `docs/sprints/` — sprint contracts (sprint_contract_N.md)
- `docs/planning/` — MDplanner Q&A files (feedback_N_topic.md)
- `spec.md` — original planning spec (historical, not maintained post-MVP)

## MDplanner

See global workflow.md. Feedback files → `docs/planning/`, sprint contracts → `docs/sprints/`.
