'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CompanySwitcherProps {
  companies: { id: string; label: string }[]
  selectedCompany?: string
}

export function CompanySwitcher({ companies, selectedCompany }: CompanySwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedLabel = useMemo(() => {
    return companies.find((company) => company.id === selectedCompany)?.label || ''
  }, [companies, selectedCompany])
  const [inputValue, setInputValue] = useState(selectedLabel)

  useEffect(() => {
    setInputValue(selectedLabel)
  }, [selectedLabel])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('company', value)
    router.push(`/dashboard?${params.toString()}`)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    const match = companies.find(
      (company) =>
        company.label.toLowerCase() === value.toLowerCase() ||
        company.id.toLowerCase() === value.toLowerCase()
    )
    if (match) {
      handleChange(match.id)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="company" className="text-sm text-slate-600">
        Azienda
      </label>
      <div className="relative">
        <input
          id="company"
          list="company-options"
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="Cerca azienda..."
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
        />
        <datalist id="company-options">
          {companies.map((company) => (
            <option key={company.id} value={company.label} />
          ))}
        </datalist>
      </div>
    </div>
  )
}
