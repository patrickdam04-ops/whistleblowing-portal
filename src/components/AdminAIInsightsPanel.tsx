'use client'

import { useState } from 'react'
import type { ConsistencyAnalysisResult } from '@/app/(public)/actions/analyze-consistency'
import { LegalAnalysisCard } from '@/components/LegalAnalysisCard'
import { SherlockConsistencyCard } from '@/components/SherlockConsistencyCard'
import { AdminResponseForm } from '@/components/AdminResponseForm'

interface AdminAIInsightsPanelProps {
  description: string
  ticketCode?: string | null
  reportId: string
  initialResponse?: string | null
}

export function AdminAIInsightsPanel({
  description,
  ticketCode,
  reportId,
  initialResponse,
}: AdminAIInsightsPanelProps) {
  const [sherlockAnalysis, setSherlockAnalysis] = useState<ConsistencyAnalysisResult | null>(null)

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SherlockConsistencyCard
          description={description}
          compact
          onAnalysis={setSherlockAnalysis}
        />
        <LegalAnalysisCard description={description} compact />
      </div>

      <div className="mt-8">
        <AdminResponseForm
          reportId={reportId}
          reportDescription={description}
          ticketCode={ticketCode}
          initialResponse={initialResponse}
          sherlockAnalysis={sherlockAnalysis}
        />
      </div>
    </div>
  )
}
