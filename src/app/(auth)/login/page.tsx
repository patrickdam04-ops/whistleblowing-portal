'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Lock, Mail, Shield } from 'lucide-react'
import { useEffect, useRef } from 'react'

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className="w-full"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Verifica in corso...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Accedi
        </span>
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [errorMessage, formAction] = useFormState(login, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="w-full max-w-md">
      {/* Card Login */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accesso Amministratore
          </h1>
          <p className="text-sm text-gray-600">
            Inserisci le tue credenziali per accedere alla dashboard
          </p>
        </div>

        {/* Messaggio di errore */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="amministratore@azienda.com"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <LoginButton />
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Accesso riservato al personale autorizzato
          </p>
        </div>
      </div>
    </div>
  )
}
