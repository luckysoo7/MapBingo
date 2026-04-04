'use client'

import { useAppStore } from '@/app/store/useAppStore'

export default function StatsCard() {
  const selectedDistrict = useAppStore((s) => s.selectedDistrict)
  const selectDistrict = useAppStore((s) => s.selectDistrict)

  if (!selectedDistrict) return null

  return (
    <div
      data-testid="stats-card"
      className="absolute z-20
                 bottom-0 left-0 w-full rounded-t-xl
                 sm:bottom-6 sm:left-4 sm:w-64 sm:rounded-xl
                 bg-white/95 backdrop-blur shadow-lg border border-gray-200 p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{selectedDistrict.name}</h3>
          <p className="text-xs text-gray-500">{selectedDistrict.sidoName}</p>
        </div>
        <button
          data-testid="stats-card-close"
          onClick={() => selectDistrict(null)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1"
          aria-label="닫기"
        >
          &times;
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">방문 일수</p>
          <p className="font-semibold text-green-700">{selectedDistrict.visitDays}일</p>
        </div>
        <div>
          <p className="text-gray-500">사진 장수</p>
          <p className="font-semibold text-gray-800">{selectedDistrict.photoCount}장</p>
        </div>
        <div>
          <p className="text-gray-500">첫 방문</p>
          <p className="font-semibold text-gray-800">{selectedDistrict.firstVisit}</p>
        </div>
        <div>
          <p className="text-gray-500">마지막 방문</p>
          <p className="font-semibold text-gray-800">{selectedDistrict.lastVisit}</p>
        </div>
      </div>
    </div>
  )
}
