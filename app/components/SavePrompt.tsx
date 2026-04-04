'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { saveCache, setCacheEnabled, isCacheEnabled } from '@/app/lib/cache'

export default function SavePrompt() {
  const status = useAppStore((s) => s.status)
  const restoredFromCache = useAppStore((s) => s.restoredFromCache)
  const savePromptDismissed = useAppStore((s) => s.savePromptDismissed)
  const dismissSavePrompt = useAppStore((s) => s.dismissSavePrompt)
  const photos = useAppStore((s) => s.photos)
  const districtStats = useAppStore((s) => s.districtStats)

  // isCacheEnabled()는 localStorage를 읽으므로 클라이언트 마운트 후 체크
  const [alreadySaved, setAlreadySaved] = useState(true)
  useEffect(() => { setAlreadySaved(isCacheEnabled()) }, [status])

  const show =
    status === 'done' &&
    !restoredFromCache &&
    !savePromptDismissed &&
    !alreadySaved

  if (!show) return null

  const handleSave = async () => {
    try {
      setCacheEnabled(true)
      await saveCache(photos, districtStats)
    } catch {
      // 저장 실패해도 프롬프트는 닫음
    } finally {
      dismissSavePrompt()
    }
  }

  return (
    <div
      data-testid="save-prompt"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20
                 bg-white rounded-2xl shadow-lg
                 flex items-center gap-5 px-6 py-4
                 whitespace-nowrap"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }}
    >
      {/* 아이콘 */}
      <div className="w-10 h-10 rounded-[10px] bg-[#F0F9F4] flex items-center justify-center flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5L4.5 8.5C4.5 12.5 7 16 10 17.5C13 16 15.5 12.5 15.5 8.5L10 2.5Z"
            fill="#E8F5E9" stroke="#2D6A4F" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M10 14V10" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="10" cy="8" r="0.8" fill="#2D6A4F"/>
        </svg>
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight">
          다음에도 바로 불러올 수 있게 저장할까요?
        </span>
        <span className="text-[12px] text-gray-400">
          저장된 데이터는 이 기기에만 남아있어요
        </span>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 flex-shrink-0 ml-1">
        <button
          data-testid="save-prompt-dismiss"
          onClick={dismissSavePrompt}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-500
                     hover:bg-gray-50 transition-colors"
        >
          나중에
        </button>
        <button
          data-testid="save-prompt-confirm"
          onClick={handleSave}
          className="px-5 py-2 bg-[#2D6A4F] rounded-lg text-[13px] font-semibold text-white
                     hover:bg-[#245a42] transition-colors"
        >
          저장하기
        </button>
      </div>
    </div>
  )
}
