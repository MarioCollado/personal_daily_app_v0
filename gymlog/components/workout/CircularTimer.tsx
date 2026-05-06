'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  time: number
  isRunning: boolean
}

export default function CircularTimer({ time, isRunning }: Props) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const progress = (time % 60) / 60
  const offset = circumference - progress * circumference

  return (
    <motion.div
      initial={false}
      animate={{ scale: isRunning ? 1.05 : 1 }}
      className="relative flex items-center justify-center py-2"
    >
      <svg className="w-32 h-32 transform -rotate-90 filter drop-shadow-lg" viewBox="0 0 128 128">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-surface-border opacity-20"
        />

        {/* Progress Circle */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{
            type: "tween",
            ease: "linear",
            duration: isRunning ? 0.05 : 0.4
          }}
          className={clsx(
            "text-brand transition-all duration-500",
            isRunning ? "opacity-100" : "opacity-30"
          )}
          strokeLinecap="round"
        />

        {/* Glow & Pulse */}
        <AnimatePresence>
          {isRunning && (
            <motion.g
              animate={{
                scale: [1, 1.02, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <motion.circle
                key="glow"
                initial={{ opacity: 0 }}
                animate={{
                  strokeDashoffset: offset,
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{
                  strokeDashoffset: {
                    type: "tween",
                    ease: "linear",
                    duration: 0.05
                  },
                  opacity: {
                    repeat: Infinity,
                    duration: 2
                  }
                }}
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                className="text-brand blur-[2px]"
                strokeLinecap="round"
              />
            </motion.g>)}
        </AnimatePresence>
      </svg>

    </motion.div>
  )
}
