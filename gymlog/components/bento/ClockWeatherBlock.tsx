'use client'
import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Loader2, MapPin } from 'lucide-react'
import type { WeatherData } from '@/types'

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  clear: <Sun className="w-5 h-5 text-amber-400" />,
  clouds: <Cloud className="w-5 h-5 text-zinc-400" />,
  rain: <CloudRain className="w-5 h-5 text-blue-400" />,
  drizzle: <CloudRain className="w-5 h-5 text-blue-300" />,
  snow: <CloudSnow className="w-5 h-5 text-blue-200" />,
  wind: <Wind className="w-5 h-5 text-zinc-300" />,
}

const CONDITION_ES: Record<string, string> = {
  clear: 'Despejado',
  clouds: 'Nublado',
  rain: 'Lluvia',
  drizzle: 'Orbayu',
  snow: 'Nieve',
  thunderstorm: 'Tormenta',
  mist: 'Niebla',
  fog: 'Niebla',
  wind: 'Viento',
}

function getConditionKey(raw: string): string {
  const l = raw.toLowerCase()
  for (const key of Object.keys(CONDITION_ES)) {
    if (l.includes(key)) return key
  }
  return 'clear'
}

interface Props {
  cachedTemp?: number | null
  cachedCondition?: string | null
}

export default function ClockWeatherBlock({ cachedTemp, cachedCondition }: Props) {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(
    cachedTemp && cachedCondition
      ? { temp: cachedTemp, condition: cachedCondition, icon: cachedCondition, city: 'Posada de Llanera' }
      : null
  )
  const [loadingWeather, setLoadingWeather] = useState(!cachedTemp)

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch weather via Open-Meteo (free, no key needed)
  useEffect(() => {
    if (cachedTemp) return
    async function fetchWeather() {
      try {
        // llanera
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=43.4419&longitude=-5.8580&current=temperature_2m,weather_code&timezone=Europe%2FMadrid'
        const res = await fetch(url)
        const json = await res.json()
        const temp = Math.round(json.current.temperature_2m)
        const code = json.current.weather_code as number
        const condition = wmoToCondition(code)
        setWeather({ temp, condition, icon: condition, city: 'Posada de Llanera' })
      } catch {
        // silent fail
      } finally {
        setLoadingWeather(false)
      }
    }
    fetchWeather()
  }, [cachedTemp])

  const hours = time.getHours().toString().padStart(2, '0')
  const mins = time.getMinutes().toString().padStart(2, '0')
  const secs = time.getSeconds().toString().padStart(2, '0')
  const dayName = time.toLocaleDateString('es-ES', { weekday: 'long' })
  const dateStr = time.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  const conditionKey = weather ? getConditionKey(weather.condition) : 'clear'
  const WeatherIcon = CONDITION_ICONS[conditionKey] || <Sun className="w-5 h-5 text-amber-400" />

  return (
    <div className="bento-card flex flex-col justify-between h-full">
      {/* Clock */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-mono font-bold tracking-tight leading-none">
            {hours}<span className="text-zinc-600">:</span>{mins}
          </span>
          <span className="text-sm font-mono text-zinc-600">{secs}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[11px] text-zinc-500 capitalize">{dayName},</span>
          <span className="text-[11px] text-zinc-500">{dateStr}</span>
        </div>
      </div>

      {/* Weather */}
      <div className="mt-3">
        {loadingWeather ? (
          <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
        ) : weather ? (
          <div className="flex items-center gap-2">
            {WeatherIcon}
            <div>
              <span className="text-xl font-mono font-bold">{weather.temp}°</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">{weather.city} · {CONDITION_ES[conditionKey] || weather.condition}</span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-zinc-600">Sin clima</span>
        )}
      </div>
    </div>
  )
}

// WMO weather code → condition string
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
