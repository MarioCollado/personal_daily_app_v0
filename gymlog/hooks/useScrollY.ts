'use client'

import { useEffect, useState } from 'react'

export function useScrollY() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const updateScrollY = () => {
      setScrollY(window.scrollY || window.pageYOffset || 0)
    }

    updateScrollY()
    window.addEventListener('scroll', updateScrollY, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollY)
    }
  }, [])

  return scrollY
}
