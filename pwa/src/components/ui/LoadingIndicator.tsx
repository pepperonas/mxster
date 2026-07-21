/**
 * M3 Expressive contained loading indicator:
 * tonal container with morphing corners + rotating arc.
 * Styles live in tailwind.css (.m3-loading) so index.html can mirror them.
 */

interface LoadingIndicatorProps {
  size?: number
  label?: string
  className?: string
}

export function LoadingIndicator({ size = 48, label, className = '' }: LoadingIndicatorProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className="m3-loading" style={{ width: size, height: size }}>
        <span className="m3-loading-arc" style={{ width: size / 2, height: size / 2 }} />
      </div>
      {label && <p className="text-label-lg text-text-secondary">{label}</p>}
      {!label && <span className="sr-only">Lädt…</span>}
    </div>
  )
}

export default LoadingIndicator
