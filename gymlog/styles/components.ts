// ─────────────────────────────────────────────────────────────
// Clases de componentes reutilizables
// Úsalas con clsx() o directamente como className
// ─────────────────────────────────────────────────────────────

// ─── Layout / contenedores ───────────────────────────────────
export const layout = {
  page:       'min-h-screen bg-surface-0 pb-24',
  main:       'max-w-lg mx-auto px-4 pt-4 space-y-4',
  mainNarrow: 'max-w-lg mx-auto px-3 pt-3 pb-4',
  header:     'sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe',
  headerInner:'max-w-lg mx-auto px-4 py-3 flex items-center justify-between',
  bentoGrid:  'grid grid-cols-2 gap-2.5 auto-rows-auto',
} as const

// ─── Cards ───────────────────────────────────────────────────
export const card = {
  base:   'bg-surface-1 border border-surface-border rounded-2xl',
  bento:  'bg-surface-1 border border-surface-border rounded-2xl p-3.5 h-full',
  inner:  'bg-surface-2 rounded-xl',
} as const

// ─── Inputs ──────────────────────────────────────────────────
export const input = {
  base:   'bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors duration-100 w-full',
  small:  'bg-surface-2 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500',
  center: 'bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors duration-100 w-full text-center',
} as const

// ─── Botones ─────────────────────────────────────────────────
export const btn = {
  primary:  'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-black font-semibold rounded-xl px-4 py-2.5 transition-colors duration-100 select-none touch-manipulation',
  ghost:    'bg-surface-3 hover:bg-surface-4 active:bg-surface-4 text-white rounded-xl px-4 py-2.5 transition-colors duration-100 select-none touch-manipulation',
  danger:   'text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg px-3 py-1.5 transition-colors duration-100 select-none touch-manipulation',
  icon:     'p-2 rounded-lg hover:bg-surface-2 transition-colors text-zinc-400 hover:text-white',
  iconSm:   'p-1.5 rounded-lg hover:bg-surface-2 transition-colors',
  chip:     'px-3 py-1.5 rounded-full text-sm transition-colors touch-manipulation',
  chipActive:   'bg-brand-500 text-black font-medium',
  chipInactive: 'bg-surface-3 text-zinc-300 hover:bg-surface-4',
  addDashed:'w-full border-2 border-dashed border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5 rounded-2xl py-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-brand-400 transition-all duration-150 touch-manipulation',
  preset:   'flex-1 text-[11px] font-mono py-1 rounded-lg transition-colors touch-manipulation',
} as const

// ─── Texto ───────────────────────────────────────────────────
export const text = {
  label:      'text-[11px] font-medium text-zinc-500 uppercase tracking-widest',
  saving:     'text-[10px] text-zinc-600 animate-pulse-dot',
  caption:    'text-xs text-zinc-500',
  captionMono:'text-xs text-zinc-500 font-mono',
  sectionTitle:'font-semibold text-sm text-zinc-400 mb-3 flex items-center gap-2',
  pageTitle:  'font-bold text-base',
  pageSubtitle:'text-zinc-500 text-xs mt-0.5',
} as const

// ─── Bento block header ──────────────────────────────────────
export const bentoHeader = 'flex items-center justify-between mb-2'
export const bentoLabel  = 'flex items-center gap-1.5'

// ─── Feedback / estado ───────────────────────────────────────
export const feedback = {
  error:   'text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2',
  success: 'text-brand-400 text-sm bg-brand-500/10 rounded-lg px-3 py-2',
  spinner: 'w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin',
  spinnerSm: 'w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin',
} as const

// ─── Nav ─────────────────────────────────────────────────────
export const nav = {
  tab:        'flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors duration-100 touch-manipulation flex-1',
  tabActive:  'text-brand-400',
  tabInactive:'text-zinc-500',
  iconActive: 'drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]',
} as const

// ─── Sets / exercise table ───────────────────────────────────
export const setRow = {
  grid:   'grid grid-cols-4 gap-2 items-center text-sm py-1.5 px-1 rounded-lg hover:bg-surface-2 group transition-colors',
  header: 'grid grid-cols-4 gap-2 text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2 px-1',
  index:  'text-zinc-600 font-mono',
  value:  'font-mono font-medium',
  muted:  'text-zinc-600 text-xs',
  deleteBtn: 'opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-1 -mr-1',
} as const
