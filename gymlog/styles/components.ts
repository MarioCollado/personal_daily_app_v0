export const layout = {
  page: "min-h-screen bg-surface-0 pb-24",
  main: "w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4",
  mainNarrow:
    "w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-3 sm:px-6 pt-3 pb-4",
  header:
    "sticky top-0 bg-surface-0/90 backdrop-blur-md border-b border-surface-border z-20 pt-safe text-main",
  headerInner:
    "w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between",
  bentoGrid:
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4",
  bento2: "grid grid-cols-2 gap-2.5 sm:gap-3",
} as const;

export const card = {
  base: "bg-surface-1 border border-surface-border rounded-2xl",
  bento:
    "bg-surface-1 border border-surface-border rounded-2xl p-3.5 sm:p-4 h-full",
  inner: "bg-surface-2 rounded-xl",
  recipe:
    "bg-surface-1 border border-surface-border rounded-2xl p-4 sm:p-5 flex flex-col gap-2 hover:border-muted/50 transition-colors",
} as const;

export const input = {
  base: "bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-main placeholder-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors duration-100 w-full text-sm sm:text-base",
  small:
    "bg-surface-2 border border-surface-border rounded-lg px-2 py-1.5 text-xs text-main placeholder-muted focus:outline-none focus:border-violet-500 w-full",
  center:
    "bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-main placeholder-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors duration-100 w-full text-center text-sm sm:text-base",
  cardio:
    "bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-main placeholder-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-colors duration-100 w-full text-center font-mono text-base",
} as const;

export const btn = {
  primary:
    "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-brand-foreground font-semibold rounded-xl px-4 py-2.5 transition-colors duration-100 select-none touch-manipulation text-sm sm:text-base",
  ghost:
    "bg-surface-3 hover:bg-surface-4 active:bg-surface-4 text-main rounded-xl px-4 py-2.5 transition-colors duration-100 select-none touch-manipulation text-sm sm:text-base",
  danger:
    "text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg px-3 py-1.5 transition-colors duration-100 select-none touch-manipulation",
  icon: "p-2 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-main",
  iconSm: "p-1.5 rounded-lg hover:bg-surface-2 transition-colors",
  chip: "px-3 py-1.5 rounded-full text-sm transition-colors touch-manipulation",
  chipActive: "bg-brand-500 text-brand-foreground font-medium",
  chipInactive:
    "bg-surface-3 text-muted hover:bg-surface-4 hover:text-main transition-colors",
  addDashed:
    "w-full border-2 border-dashed border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5 rounded-2xl py-4 flex items-center justify-center gap-2 text-muted hover:text-brand-400 transition-all duration-150 touch-manipulation",
  preset:
    "flex-1 text-[11px] font-mono py-1 rounded-lg transition-colors touch-manipulation",
} as const;

export const text = {
  label:
    "text-[11px] sm:text-xs font-semibold text-muted uppercase tracking-widest",
  saving: "text-[10px] text-muted animate-pulse-dot",
  caption: "text-xs sm:text-sm text-muted",
  captionMono: "text-xs text-muted font-mono",
  sectionTitle:
    "font-semibold text-sm sm:text-base text-muted/80 mb-3 flex items-center gap-2",
  pageTitle: "font-bold text-base sm:text-lg text-main",
  pageSubtitle: "text-muted text-xs sm:text-sm mt-0.5",
} as const;

export const bentoHeader = "flex items-center justify-between mb-2 sm:mb-3";
export const bentoLabel = "flex items-center gap-1.5";

export const feedback = {
  error: "text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2",
  success: "text-brand-400 text-sm bg-brand-500/10 rounded-lg px-3 py-2",
  spinner:
    "w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin",
  spinnerSm:
    "w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin",
} as const;

export const nav = {
  tab: "flex flex-col items-center gap-0.5 sm:gap-1 py-2 text-[10px] sm:text-xs font-medium transition-colors duration-100 touch-manipulation flex-1",
  tabActive: "text-brand-400",
  tabInactive: "text-muted",
  iconActive: "drop-shadow-[0_0_6px_var(--brand)]",
} as const;

export const setRow = {
  grid: "grid grid-cols-4 gap-2 items-center text-sm py-1.5 px-1 rounded-lg hover:bg-surface-2 group transition-colors",
  gridCardio:
    "grid grid-cols-4 gap-2 items-center text-sm py-1.5 px-1 rounded-lg hover:bg-surface-2 group transition-colors",
  header:
    "grid grid-cols-4 gap-2 text-[11px] text-muted font-medium uppercase tracking-wider mb-2 px-1",
  index: "text-muted font-mono",
  value: "font-mono font-medium text-main",
  muted: "text-muted text-xs",
  deleteBtn:
    "opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-400 p-1 -mr-1",
} as const;

export const cardio = {
  paceDisplay:
    "flex items-center justify-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-2.5",
  paceValue: "text-xl font-mono font-bold text-sky-400",
  paceUnit: "text-xs text-muted",
  paceLabel: "text-[10px] text-muted uppercase tracking-widest",
} as const;

export const recipe = {
  heroBento:
    "bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-4 sm:p-5",
  tag: "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium",
  tagCalories: "bg-orange-500/20 text-orange-300",
  tagTime: "bg-blue-500/20 text-blue-300",
  tagProtein: "bg-brand-500/20 text-brand-300",
  ingredient:
    "flex items-center gap-2 py-2 border-b border-surface-border last:border-0",
} as const;
