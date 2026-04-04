'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/app/store/useAppStore'
import { usePhotoUpload } from '@/app/hooks/usePhotoUpload'

export default function UploadOverlay() {
  const { status, skippedNoGps, skippedHeic, photos, emptyFolderWarning } = useAppStore()
  const { onDrop, onSelectFolder, startParsing } = usePhotoUpload()
  const [isDragging, setIsDragging] = useState(false)
  const [hasDirectoryPicker, setHasDirectoryPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHasDirectoryPicker(typeof (window as unknown as Record<string, unknown>).showDirectoryPicker === 'function')
  }, [])

  // GPS 없는 사진만 → 안내 표시
  const noGpsOnly = status === 'done' && photos.length === 0 && (skippedNoGps > 0 || skippedHeic > 0)

  if (noGpsOnly) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          data-testid="no-gps-warning"
          className="max-w-[460px] w-[calc(100%-32px)] rounded-2xl p-8 sm:p-12 flex flex-col items-center gap-4
                     bg-white/88 backdrop-blur-sm border-[1.5px] border-dashed border-gray-300"
        >
          <div className="w-14 h-14 rounded-[14px] bg-gray-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" stroke="#999" strokeWidth="1.6"/>
              <path d="M14 9v6M14 18v.5" stroke="#999" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center flex flex-col gap-2">
            <p className="text-[16px] font-semibold text-gray-900 tracking-tight">
              GPS 정보가 있는 사진을 찾지 못했습니다
            </p>
            <p className="text-[13px] text-gray-400 leading-relaxed">
              {skippedNoGps > 0 && `${skippedNoGps}장 위치 정보 없음`}
              {skippedNoGps > 0 && skippedHeic > 0 && ' · '}
              {skippedHeic > 0 && `${skippedHeic}장 미지원 형식`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 수집/파싱 중이거나 완료 후엔 오버레이 숨김
  if (status === 'collecting' || status === 'parsing' || status === 'done') return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { setIsDragging(false); onDrop(e) }}
    >
      <div
        className={`
          max-w-[460px] w-[calc(100%-32px)] rounded-2xl p-8 sm:p-12 flex flex-col items-center gap-5 transition-all duration-200
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
          {hasDirectoryPicker ? (
            <p className="text-[18px] font-semibold text-gray-900 tracking-tight leading-snug">
              사진 폴더를 드래그하거나 선택하세요
            </p>
          ) : (
            <p className="text-[18px] font-semibold text-gray-900 tracking-tight leading-snug">
              여행 사진을 선택하세요
            </p>
          )}
          <p className="text-[13px] text-gray-400 leading-relaxed">
            GPS가 담긴 JPEG · PNG 사진을 자동으로 인식합니다<br/>
            사진은 기기 밖으로 전송되지 않아요
          </p>
        </div>

        {/* 빈 폴�� 경고 */}
        {emptyFolderWarning && (
          <p data-testid="empty-folder-warning" className="text-[13px] text-red-500 font-medium">
            폴더에 사진이 없습니다
          </p>
        )}

        {/* 버튼: API 지원 여부로 분기 (화면 크기 무관) */}
        {hasDirectoryPicker ? (
          <button
            onClick={onSelectFolder}
            className="px-8 py-2.5 sm:px-8 sm:py-2.5 border-[1.5px] border-[#2D6A4F] rounded-[9px] text-[#2D6A4F] text-[14px] sm:text-[13px] font-medium
                       hover:bg-[#2D6A4F] hover:text-white active:bg-[#2D6A4F] active:text-white transition-colors duration-150"
          >
            폴더 선택하기
          </button>
        ) : (
          <button
            data-testid="unsupported-browser"
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-3.5 border-[1.5px] border-[#2D6A4F] rounded-[9px] text-[#2D6A4F] text-[14px] font-medium
                       active:bg-[#2D6A4F] active:text-white transition-colors duration-150 w-full sm:w-auto"
          >
            사진 선택하기
          </button>
        )}

        {/* 파일 선택기 (showDirectoryPicker 미지원 브라우저용 + 테스트용) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
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
