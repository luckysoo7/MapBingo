'use client'

import { useState } from 'react'
import { useAppStore } from '@/app/store/useAppStore'

export default function DiagnosticPanel() {
  const { status, progress, photos, districtStats, skippedHeic, skippedNoGps, _debug } = useAppStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-14 right-2 z-50">
      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-black/80 text-white text-[10px] px-2 py-1 rounded font-mono"
      >
        {open ? '닫기' : `DEBUG (${status})`}
      </button>

      {open && (
        <div className="mt-1 bg-black/90 text-green-400 text-[10px] font-mono p-3 rounded-lg w-[320px] max-h-[60vh] overflow-y-auto leading-relaxed">
          {/* 파이프라인 상태 */}
          <div className="border-b border-green-900 pb-2 mb-2">
            <p>status: <span className="text-yellow-300">{status}</span></p>
            <p>progress: {progress.processed}/{progress.total}</p>
            <p>photos (GPS): <span className="text-yellow-300">{photos.length}</span></p>
            <p>districts: <span className="text-yellow-300">{districtStats.length}</span></p>
            <p>skipped HEIC: {skippedHeic}</p>
            <p>skipped noGPS: {skippedNoGps}</p>
          </div>

          {/* 로그 */}
          <div>
            {_debug.length === 0 && <p className="text-gray-500">로그 없음</p>}
            {_debug.map((msg, i) => (
              <p key={i} className={msg.includes('에러') || msg.includes('error') || msg.includes('crash') ? 'text-red-400' : ''}>
                {msg}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
