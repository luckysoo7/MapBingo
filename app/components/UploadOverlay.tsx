'use client'

import { useState } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { usePhotoUpload } from '@/app/hooks/usePhotoUpload'

export default function UploadOverlay() {
  const { status } = useAppStore()
  const { onDrop, onSelectFolder, startParsing } = usePhotoUpload()
  const [isDragging, setIsDragging] = useState(false)

  // 파싱 중이거나 완료 후엔 오버레이 숨김
  if (status === 'parsing' || status === 'done') return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { setIsDragging(false); onDrop(e) }}
    >
      <div
        className={`
          w-[460px] rounded-2xl p-12 flex flex-col items-center gap-5 transition-all duration-200
          bg-white/88 backdrop-blur-sm
          ${isDragging
            ? 'border-2 border-[#2D6A4F] bg-[#2D6A4F]/5 scale-[1.02]'
            : 'border-[1.5px] border-dashed border-[#2D6A4F]'
          }
        `}
      >
        {/* 카메라 아이콘 */}
        <div className="w-14 h-14 rounded-[14px] bg-[#2D6A4F]/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="3" y="8" width="22" height="16" rx="2.5" stroke="#2D6A4F" strokeWidth="1.6"/>
            <circle cx="14" cy="16" r="4" stroke="#2D6A4F" strokeWidth="1.6"/>
            <path d="M10 8V7a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 텍스트 */}
        <div className="text-center flex flex-col gap-2">
          <p className="text-[18px] font-semibold text-gray-900 tracking-tight leading-snug">
            사진 폴더를 드래그해서 놓으세요
          </p>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            GPS가 담긴 JPEG · PNG 사진을 자동으로 인식합니다<br/>
            사진은 기기 밖으로 전송되지 않아요
          </p>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] text-gray-300 tracking-widest">또는</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* 버튼 */}
        <button
          onClick={onSelectFolder}
          className="px-8 py-2.5 border-[1.5px] border-[#2D6A4F] rounded-[9px] text-[#2D6A4F] text-[13px] font-medium
                     hover:bg-[#2D6A4F] hover:text-white transition-colors duration-150"
        >
          폴더 선택하기
        </button>

        {/* 테스트용 hidden file input (Playwright에서 setInputFiles로 접근) */}
        <input
          type="file"
          multiple
          data-testid="file-input"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) startParsing(files)
          }}
        />
      </div>
    </div>
  )
}
