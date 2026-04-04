'use client'

import { useAppStore } from '@/app/store/useAppStore'

export default function ProgressBar() {
  const { status, progress, skippedHeic, skippedNoGps } = useAppStore()

  if (status === 'idle') return null

  const { processed, total } = progress
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-80 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
      {status === 'parsing' && (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            {processed.toLocaleString()} / {total.toLocaleString()}장 분석 중...
          </p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6A4F] rounded-full transition-all duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      )}

      {status === 'done' && (
        <>
          <p className="text-sm font-medium text-gray-800 mb-1">
            ✓ {(processed - skippedHeic - skippedNoGps).toLocaleString()}장 분석 완료
          </p>
          {skippedHeic > 0 && (
            <p className="text-xs text-gray-400">{skippedHeic}장 미지원 형식 (HEIC)</p>
          )}
          {skippedNoGps > 0 && (
            <p className="text-xs text-gray-400">{skippedNoGps}장 위치 정보 없음</p>
          )}
        </>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-500">오류가 발생했습니다. 다시 시도해 주세요.</p>
      )}
    </div>
  )
}
