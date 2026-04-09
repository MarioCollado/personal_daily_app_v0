'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import es from '../locales/es.json'
import en from '../locales/en.json'

type Language = 'es' | 'en'
type Translations = typeof es

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, variables?: Record<string, string | number>) => string
}

const translations: Record<Language, any> = { es, en }

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('es')

  useEffect(() => {
    // Detect language from localStorage or browser
    const stored = localStorage.getItem('language') as Language
    if (stored && (stored === 'es' || stored === 'en')) {
      setLanguageState(stored)
    } else {
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'en' || browserLang === 'es') {
        setLanguageState(browserLang as Language)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value[k]) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    if (typeof value !== 'string') return key

    if (variables) {
      Object.entries(variables).forEach(([name, val]) => {
        value = (value as string).replace(`{${name}}`, String(val))
      })
    }

    return value as string
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
