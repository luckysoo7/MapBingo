'use client'

import { useAppStore } from '@/app/store/useAppStore'

export default function ProgressBar() {
  const { status, progress, skippedHeic, skippedNoGps, collectingCount } = useAppStore()

  if (status === 'idle') return null

  const { processed, total } = progress
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  const isCollecting = status === 'collecting'
  const isParsing = status === 'parsing'
  const stepLabel = isCollecting ? '1' : '2'

  return (
    <div className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 z-20 w-80 bg-white/88 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-white/60">

      {/* 단계 인디케이터 */}
      {(isCollecting || isParsing) && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${isCollecting ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />
          <div className={`w-2 h-2 rounded-full ${isParsing ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />
          <span className="text-[11px] text-gray-400 ml-1">{stepLabel} / 2단계</span>
        </div>
      )}

      {isCollecting && (
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">파일 수집 중</p>
            {collectingCount > 0 && (
              <p className="text-xs text-gray-400">{collectingCount.toLocaleString()}개 발견 중...</p>
            )}
          </div>
        </div>
      )}

      {isParsing && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3.5 h-3.5 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">위치 정보 분석 중</p>
              {total > 0 && (
                <p className="text-xs text-gray-400">
                  {processed.toLocaleString()} / {total.toLocaleString()}장 ({percent}%)
                </p>
              )}
            </div>
          </div>
          {total > 0 && (
            <div className="w-full h-1 bg-gray-100/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2D6A4F] rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
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
