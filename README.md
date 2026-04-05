# MapBingo

> *Because "I've been to a lot of places" deserves better than a shrug.*

MapBingo reads the GPS metadata buried in your photos and paints a map of everywhere you've ever been — down to the exact administrative district. Drop in a folder of photos. Watch Korea light up.

No servers. No accounts. No cloud upload. Your photos never leave your browser.

---

## ⚠️ Project Status: Concluded (2026-04-05)

**The web MVP works and is deployed, but the project has hit a structural wall.**

The core use case — scanning a full mobile photo library (33,000+ photos, 200GB) — is not achievable with a browser-only architecture. Here's why:

| Layer | Bottleneck | Fixable? |
|-------|-----------|----------|
| File enumeration | `showDirectoryPicker` must open every file handle one-by-one | ❌ Browser API design |
| EXIF parsing | `exifr` must read each file for GPS metadata | ❌ No bulk GPS query in browsers |
| Mobile CPU/I/O | 50–75× slower than desktop for the same workload | ❌ Hardware constraint |

At 33K photos, the total processing time is **~24 minutes on mobile**. This is not a bug — it's the ceiling of the File System Access API.

**What a real fix would require:** A native Android/iOS app with direct MediaStore SQL access can return GPS coordinates for 33K photos in 1–5 seconds via a single bulk query. That's a different product.

**What works today:** Desktop use with smaller photo collections (under ~2,000 photos) runs fine. The Vercel deployment remains live as a demo.

---

## What it does

1. You drag a folder of photos onto the page
2. MapBingo quietly reads the GPS EXIF data in each file (entirely client-side)
3. Every district you've visited gets colored green — the more days you've spent there, the deeper the shade
4. Click any district to see a stats card: visit days, photo count, first and last visit date
5. Come back tomorrow — the map restores instantly from local cache

---

## Demo

Live: [mapbingo.vercel.app](https://mapbingo.vercel.app)

*Korea, from a phone full of memories.*

---

## Tech stack

| Layer | What |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Map | MapLibre GL JS + MapTiler Streets |
| Districts | [southkorea-maps](https://github.com/southkorea/southkorea-maps) GeoJSON — 251 시/군/구 |
| EXIF parsing | exifr (Web Worker, non-blocking) |
| Spatial ops | @turf/boolean-point-in-polygon |
| State | Zustand |
| Cache | IndexedDB — GPS coordinates only, never photo data |
| Deploy | Vercel |

---

## Color scale

Visits are colored on a log scale so that "went there once" and "basically live there" both read clearly.

```
never visited  →  #E8E8E8  (light gray)
1–2 days       →  #C8E6C9
3–7 days       →  #81C784
8–20 days      →  #388E3C
21+ days       →  #1B5E20  (deep green)
```

---

## Running locally

```bash
git clone https://github.com/luckysoo7/MapBingo.git
cd MapBingo
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key_here
```

Get a free MapTiler key at [maptiler.com](https://maptiler.com) — no credit card required.

```bash
npm run dev
# → http://localhost:3000
```

---

## Sprint history

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Next.js setup + EXIF engine | ✅ done (Playwright 4/4) |
| 2 | GeoJSON mapping + map coloring | ✅ done (Playwright 4/4) |
| 3 | Number labels + stats card | ✅ done (Playwright 6/6) |
| 4 | IndexedDB caching + first-run UX | ✅ done (Playwright 4/4) |
| 5 | Mobile responsive + edge cases | ✅ done (Playwright 6/6) |
| Mobile pivot | RN + Expo — bulk GPS via MediaStore | 🚫 concluded (structural limit) |

All 24 Playwright tests passing at conclusion.

---

## Privacy

All photo processing happens locally in your browser via the HTML5 File API. GPS coordinates are cached in IndexedDB on your device. Photo files are never uploaded anywhere. You can disable caching entirely from the settings menu.

---

## Limitations

- HEIC files (iPhone default format) are skipped — convert to JPEG first
- Photos without GPS data are skipped silently
- Korean administrative districts only
- Samsung Internet browser is not supported — use Chrome
- **Mobile large libraries (10,000+ photos): not recommended** — see Project Status above

---

## Why I built this

I take a lot of photos. I travel around a lot. At some point I wanted a way to look at a map and actually *see* the shape of where I've been — not just a list of filenames or a cluster of pins, but a real geographic picture. Nothing that existed did quite what I wanted. So here we are.

---

Built with Next.js · Deployed on Vercel · Made by [luckysoo7](https://github.com/luckysoo7)
