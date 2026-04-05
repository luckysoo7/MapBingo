import { View, Text, StyleSheet } from 'react-native'
import type { DistrictStat } from '../lib/geoMapping'

const TOTAL_DISTRICTS = 251

interface Props {
  stats: DistrictStat[]
}

export function StatsCard({ stats }: Props) {
  const visited = stats.length
  const pct = ((visited / TOTAL_DISTRICTS) * 100).toFixed(1)
  const totalPhotos = stats.reduce((sum, s) => sum + s.photoCount, 0)

  return (
    <View style={styles.card}>
      <Text style={styles.main}>
        {visited}
        <Text style={styles.total}> / {TOTAL_DISTRICTS}</Text>
      </Text>
      <Text style={styles.label}>방문 시·군·구</Text>
      <View style={styles.divider} />
      <Text style={styles.sub}>{pct}% 달성</Text>
      <Text style={styles.sub}>{totalPhotos.toLocaleString()}장</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 16,
    padding: 16,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  main: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
  },
  total: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  sub: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
})
