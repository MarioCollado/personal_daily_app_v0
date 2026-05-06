'use client'
import React, { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Loader2, MapPin, RotateCcw } from 'lucide-react'
import type { WeatherData } from '@/types'
import { useI18n } from '@/contexts/I18nContext'

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  clear: <Sun className="w-5 h-5 text-amber-400" />,
  clouds: <Cloud className="w-5 h-5 text-muted" />,
  rain: <CloudRain className="w-5 h-5 text-blue-400" />,
  drizzle: <CloudRain className="w-5 h-5 text-blue-300" />,
  snow: <CloudSnow className="w-5 h-5 text-blue-200" />,
  wind: <Wind className="w-5 h-5 text-muted" />,
}

function getConditionKey(raw: string): string {
  const l = raw.toLowerCase()
  const keys = ['clear', 'clouds', 'rain', 'drizzle', 'snow', 'thunderstorm', 'mist', 'fog', 'wind']
  for (const key of keys) {
    if (l.includes(key)) return key
  }
  return 'clear'
}

interface Props {
  cachedTemp?: number | null
  cachedCondition?: string | null
}

export default function ClockWeatherBlock({ cachedTemp, cachedCondition }: Props) {
  const { t, language } = useI18n()
  const [time, setTime] = useState(new Date())
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(
    cachedTemp && cachedCondition
      ? { temp: cachedTemp, condition: cachedCondition, icon: cachedCondition, city: t('dashboard.weather.near_you') }
      : null
  )
  const [loadingWeather, setLoadingWeather] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function handleRequestLocation() {
    if (!navigator.geolocation) return
    setLoadingWeather(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        setLoadingWeather(false)
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    if (!coords) return
    const { lat, lon } = coords

    async function fetchWeather() {
      try {
        setLoadingWeather(true)
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(tz)}`
        const res = await fetch(url)
        const json = await res.json()
        const temp = Math.round(json.current.temperature_2m)
        const code = json.current.weather_code as number
        const condition = wmoToCondition(code)
        
        setWeather({ 
          temp, 
          condition, 
          icon: condition, 
          city: t('dashboard.weather.near_you')
        })
      } catch (err) {
        console.error('Weather fetch error:', err)
      } finally {
        setLoadingWeather(false)
      }
    }

    fetchWeather()
  }, [coords, t])

  const hours = time.getHours().toString().padStart(2, '0')
  const mins = time.getMinutes().toString().padStart(2, '0')
  const secs = time.getSeconds().toString().padStart(2, '0')
  const dayName = time.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' })
  const dateStr = time.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long' })

  const conditionKey = weather ? getConditionKey(weather.condition) : 'clear'
  const WeatherIcon = CONDITION_ICONS[conditionKey] || <Sun className="w-5 h-5 text-amber-400" />

  return (
    <div className="bento-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight leading-none text-main">
            {hours}
            <span className="text-muted/40 mx-0.5">:</span>
            {mins}
          </span>
          <span className="text-xs lg:text-sm font-mono text-muted/60 ml-0.5">{secs}</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-muted">
          <span className="text-[11px] lg:text-xs font-medium capitalize">{dayName},</span>
          <span className="text-[11px] lg:text-xs font-medium">{dateStr}</span>
        </div>
      </div>

      <div className="mt-3 lg:mt-4">
        {loadingWeather ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 text-muted animate-spin" />
            <span className="text-[10px] lg:text-xs text-muted font-medium animate-pulse">{t('dashboard.weather.updating')}</span>
          </div>
        ) : weather ? (
          <div className="flex items-center gap-2 lg:gap-3">
            {React.cloneElement(WeatherIcon as React.ReactElement, { className: 'w-5 h-5 lg:w-6 lg:h-6' })}
            <div>
              <span className="text-xl lg:text-2xl font-mono font-bold text-main">{weather.temp}°</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-muted" />
                <span className="text-[10px] lg:text-xs text-muted font-medium uppercase tracking-titer transform scale-90 origin-left">
                  {weather.city} · {t(`dashboard.weather.conditions.${conditionKey}`) || weather.condition}
                </span>
                <button 
                  onClick={handleRequestLocation}
                  className="ml-1 text-muted hover:text-main transition-colors p-0.5"
                  title={t('dashboard.weather.refresh')}
                >
                  <RotateCcw className="w-2 h-2 lg:w-2.5 lg:h-2.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleRequestLocation}
            className="flex items-center gap-2 py-1.5 lg:py-2 px-3 lg:px-4 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted hover:text-main transition-all group border border-surface-border active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-violet-400 group-hover:animate-bounce" />
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider">{t('dashboard.weather.get_weather')}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function wmoToCondition(code: number): string {
  if (code === 0) return 'clear'
  if (code <= 3) return 'clouds'
  if (code <= 49) return 'mist'
  if (code <= 59) return 'drizzle'
  if (code <= 69) return 'rain'
  if (code <= 79) return 'snow'
  if (code <= 82) return 'rain'
  if (code <= 99) return 'thunderstorm'
  return 'clear'
}
