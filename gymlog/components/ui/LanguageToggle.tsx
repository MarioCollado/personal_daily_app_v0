'use client'
import React from 'react'
import { Languages } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { clsx } from 'clsx'

export function LanguageToggle() {
  const { language, setLanguage } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  return (
    <button
      onClick={toggleLanguage}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300',
        'bg-surface-2 border-surface-border text-muted hover:text-main hover:bg-surface-3'
      )}
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Languages className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {language.toUpperCase()}
      </span>
    </button>
  )
}
