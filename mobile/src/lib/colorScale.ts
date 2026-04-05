// 웹과 동일한 녹색 계열 (photoCount 기준)
export const DISTRICT_COLORS = {
  unvisited: '#E8E8E8',
  low:       '#C8E6C9', // 1~5장
  mid:       '#81C784', // 6~20장
  high:      '#388E3C', // 21~100장
  max:       '#1B5E20', // 101장+
}

// MapLibre fill-color expression (photoCount property 기준)
export const FILL_COLOR_EXPRESSION = [
  'case',
  ['<=', ['coalesce', ['get', 'photoCount'], 0], 0],   DISTRICT_COLORS.unvisited,
  ['<=', ['coalesce', ['get', 'photoCount'], 0], 5],   DISTRICT_COLORS.low,
  ['<=', ['coalesce', ['get', 'photoCount'], 0], 20],  DISTRICT_COLORS.mid,
  ['<=', ['coalesce', ['get', 'photoCount'], 0], 100], DISTRICT_COLORS.high,
  DISTRICT_COLORS.max,
]
