'use client'

type PageLoaderProps = {
  message?: string
}

export default function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        {message ? <p className="text-muted text-sm font-medium">{message}</p> : null}
      </div>
    </div>
  )
}
