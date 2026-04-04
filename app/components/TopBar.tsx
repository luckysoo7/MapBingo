'use client'

import { useState, useRef, useEffect } from 'react'
import { clearCache, isCacheEnabled, setCacheEnabled } from '@/app/lib/cache'

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cacheOn, setCacheOn] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setCacheOn(isCacheEnabled()) }, [])

  // 메뉴 외부 클릭 → 닫기
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const toggleCache = async () => {
    const next = !cacheOn
    setCacheOn(next)
    setCacheEnabled(next)
    if (!next) await clearCache()
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
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight">SnapRoute</span>
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
          <div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-30">
            <label className="flex items-center justify-between cursor-pointer" data-testid="cache-toggle">
              <span className="text-sm text-gray-700">데이터 저장 (캐시)</span>
              <div
                className={`w-9 h-5 rounded-full relative transition-colors ${cacheOn ? 'bg-green-600' : 'bg-gray-300'}`}
                onClick={toggleCache}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cacheOn ? 'translate-x-4' : 'translate-x-0.5'}`}/>
              </div>
            </label>
          </div>
        )}
      </div>
    </nav>
  )
}
