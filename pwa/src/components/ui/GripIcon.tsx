/** Six dots: "this can be dragged". */
export function GripIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-shrink-0 opacity-70">
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.6" />
          <circle cx="15" cy={y} r="1.6" />
        </g>
      ))}
    </svg>
  )
}
