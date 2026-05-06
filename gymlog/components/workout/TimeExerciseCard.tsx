'use client'
import { motion, AnimatePresence } from 'framer-motion'
import TimeSetComposer from './TimeSetComposer'
import TimeSetRow from './TimeSetRow'
import type { Exercise } from '@/types'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  exercise: Exercise
  onAddSet: (durationSeconds: number) => void
  onDeleteSet: (setId: string) => void
  addError?: string | null
}

export default function TimeExerciseCard({ exercise, onAddSet, onDeleteSet, addError }: Props) {
  const { t } = useI18n()
  const sets = exercise.sets || []
  
  return (
    <div className="space-y-6">
      {/* Timer Section */}
      <div className="bg-surface-2/30 rounded-3xl p-2 border border-surface-border/50">
        <TimeSetComposer
          onAddSet={onAddSet}
          adding={false}
          previousSets={sets}
        />
        
        {addError && (
          <motion.p 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-red-400 mt-4 text-center font-medium"
          >
            {addError}
          </motion.p>
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4 px-1">
        <div className="flex items-center justify-between border-b border-surface-border/50 pb-2">
          <h4 className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">{t('workout.timer.session_sets')}</h4>
          <span className="text-[10px] font-mono text-muted bg-surface-2 px-2 py-0.5 rounded-full">
            {t('workout.timer.total_count', { count: sets.length })}
          </span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-surface-border">
          <AnimatePresence initial={false} mode="popLayout">
            {[...sets].reverse().map((set, idx) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <TimeSetRow
                  set={set}
                  index={sets.length - idx}
                  onDelete={() => onDeleteSet(set.id)}
                  isLast={idx === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {sets.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-center py-8 text-xs italic text-muted"
            >
              {t('workout.timer.no_sets')}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}
