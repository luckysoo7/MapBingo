export const DISTRICT_COLORS = {
  unvisited: '#E8E8E8',
  low:       '#C8E6C9', // 1-2일
  mid:       '#81C784', // 3-7일
  high:      '#388E3C', // 8-20일
  max:       '#1B5E20', // 21일+
}

// coalesce로 visitDays null → 0 처리 (MapLibre 타입 에러 방지)
export const FILL_COLOR_EXPRESSION = [
  'case',
  ['<=', ['coalesce', ['get', 'visitDays'], 0], 0],  DISTRICT_COLORS.unvisited,
  ['<=', ['coalesce', ['get', 'visitDays'], 0], 2],  DISTRICT_COLORS.low,
  ['<=', ['coalesce', ['get', 'visitDays'], 0], 7],  DISTRICT_COLORS.mid,
  ['<=', ['coalesce', ['get', 'visitDays'], 0], 20], DISTRICT_COLORS.high,
  DISTRICT_COLORS.max,
]
