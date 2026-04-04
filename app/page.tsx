'use client'

import dynamic from 'next/dynamic'
import TopBar from '@/app/components/TopBar'
import UploadOverlay from '@/app/components/UploadOverlay'
import ProgressBar from '@/app/components/ProgressBar'
import StatsCard from '@/app/components/StatsCard'
import SavePrompt from '@/app/components/SavePrompt'
import { useCacheRestore } from '@/app/hooks/useCacheRestore'

const MapView = dynamic(() => import('@/app/components/MapView'), { ssr: false })

export default function Home() {
  useCacheRestore()

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <TopBar />

      {/* 지도 (상단바 아래부터 전체) */}
      <div className="absolute inset-0 top-12">
        <MapView />
        <UploadOverlay />
        <ProgressBar />
        <StatsCard />
        <SavePrompt />
      </div>
    </main>
  )
}
