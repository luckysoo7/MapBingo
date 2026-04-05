'use client'

import { useState, useRef, useEffect } from 'react'
import { clearCache, setCacheEnabled } from '@/app/lib/cache'
import { useAppStore } from '@/app/store/useAppStore'

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const status = useAppStore((s) => s.status)
  const reset = useAppStore((s) => s.reset)
  const progress = useAppStore((s) => s.progress)
  const photos = useAppStore((s) => s.photos)
  const districtStats = useAppStore((s) => s.districtStats)
  const skippedHeic = useAppStore((s) => s.skippedHeic)
  const skippedNoGps = useAppStore((s) => s.skippedNoGps)
  const _debug = useAppStore((s) => s._debug)

  // 메뉴 외부 클릭 → 닫기
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleReset = async () => {
    setCacheEnabled(false)
    await clearCache()
    reset()
    setMenuOpen(false)
  }

  return (
    <nav className="absolute top-0 left-0 right-0 h-12 bg-white border-b border-black/[0.08] flex items-center justify-between px-7 z-20">
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="9" r="5" fill="#2D6A4F"/>
          <circle cx="11" cy="9" r="2.2" fill="white"/>
          <path d="M8 18 Q11 14 14 18" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <line x1="8" y1="18" x2="14" y2="18" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight">MapBingo</span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="설정"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="#777" strokeWidth="1.5"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
              stroke="#777" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-30">
            {status === 'done' ? (
              <button
                data-testid="reset-button"
                onClick={handleReset}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                데이터 초기화
              </button>
            ) : (
              <p className="px-3 py-2 text-sm text-gray-400">분석 완료 후 설정 가능</p>
            )}
            <button
              onClick={() => { setDebugOpen(!debugOpen); setMenuOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-md transition-colors font-mono"
            >
              {debugOpen ? '디버그 닫기' : `디버그 (${status})`}
            </button>
          </div>
        )}

        {/* 디버그 패널 */}
        {debugOpen && (
          <div className="absolute right-0 top-10 z-30 bg-black/90 text-green-400 text-[10px] font-mono p-3 rounded-lg w-[320px] max-h-[60vh] overflow-y-auto leading-relaxed shadow-2xl">
            <div className="flex items-center justify-between mb-2 border-b border-green-900 pb-2">
              <span className="text-yellow-300 font-bold">DEBUG</span>
              <button onClick={() => setDebugOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="border-b border-green-900 pb-2 mb-2">
              <p>status: <span className="text-yellow-300">{status}</span></p>
              <p>progress: {progress.processed}/{progress.total}</p>
              <p>photos (GPS): <span className="text-yellow-300">{photos.length}</span></p>
              <p>districts: <span className="text-yellow-300">{districtStats.length}</span></p>
              <p>skipped HEIC: {skippedHeic}</p>
              <p>skipped noGPS: {skippedNoGps}</p>
            </div>
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
    </nav>
  )
}
