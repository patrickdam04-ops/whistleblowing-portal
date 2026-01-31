'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface CompanySwitcherProps {
  companies: string[]
  selectedCompany?: string
}

export function CompanySwitcher({ companies, selectedCompany }: CompanySwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('company', value)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="company" className="text-sm text-slate-600">
        Azienda
      </label>
      <select
        id="company"
        value={selectedCompany}
        onChange={(event) => handleChange(event.target.value)}
        className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {companies.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </select>
    </div>
  )
}
