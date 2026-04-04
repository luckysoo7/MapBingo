---
paths:
  - "app/components/**"
  - "app/hooks/**"
  - "app/lib/**"
---

# MapLibre GL JS Rules — SnapRoute

## CRITICAL: Container Must Use `w-full h-full`

MapLibre injects `.maplibregl-map { position: relative }` onto the container div,
overriding Tailwind's `absolute`. Result: `absolute inset-0` → computed height 0px → canvas defaults to 300px.

```tsx
// ✅ Correct
<div ref={containerRef} className="w-full h-full" />

// ❌ Never — height collapses to 0
<div ref={containerRef} className="absolute inset-0" />
```

Verified via `getBoundingClientRect()` diagnostic (Sprint 2, 2026-04-04).

## Null-Safe fill-color Expressions

`['get', 'visitDays']` returns `null` for features without the property.
`<=` comparison on null → "Expected value to be of type number, but found null" runtime error.

```javascript
// ✅ Always wrap with coalesce
['<=', ['coalesce', ['get', 'visitDays'], 0], 2]

// ❌ Will throw on features without visitDays
['<=', ['get', 'visitDays'], 2]
```

## Source Data Update Pattern

Use `source.setData(updatedGeoJSON)` with `visitDays` embedded as a GeoJSON feature property.

```typescript
const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
source?.setData(updatedFeatureCollection)
```

Do **not** use `setFeatureState` — timing issues between districtStats updates and layer readiness caused silent failures.

## ResizeObserver (prevents 300px canvas on init)

```typescript
const ro = new ResizeObserver(() => { map.resize() })
ro.observe(containerRef.current!)
// In cleanup:
ro.disconnect()
```
