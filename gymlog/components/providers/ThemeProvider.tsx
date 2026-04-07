'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemePeriod } from '@/styles/themes'

interface ThemeContextType {
  theme: ThemePeriod
  isSober: boolean
  toggleSober: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemePeriod>('sober')
  const [isSober, setIsSober] = useState(false)

  useEffect(() => {
    // Check initial preference
    const stored = localStorage.getItem('app-theme-mode')
    const forceSober = stored === 'sober'
    setIsSober(forceSober)

    const updateTheme = () => {
      if (forceSober) {
        setTheme('sober')
        document.documentElement.setAttribute('data-theme', 'sober')
        return
      }

      const hour = new Date().getHours()
      let current: ThemePeriod = 'midday'

      if (hour >= 6 && hour < 12) current = 'morning'
      else if (hour >= 12 && hour < 18) current = 'midday'
      else if (hour >= 18 && hour < 21) current = 'afternoon'
      else current = 'night'

      setTheme(current)
      document.documentElement.setAttribute('data-theme', current)
    }

    updateTheme()
    const interval = setInterval(updateTheme, 60000) // Re-check every minute

    return () => clearInterval(interval)
  }, [isSober])

  const toggleSober = () => {
    const next = !isSober
    setIsSober(next)
    localStorage.setItem('app-theme-mode', next ? 'sober' : 'automatic')
  }

  return (
    <ThemeContext.Provider value={{ theme, isSober, toggleSober }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
