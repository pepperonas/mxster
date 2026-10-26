export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Rechtliches" className={`flex justify-center gap-6 text-label-md text-md-on-surface-variant ${className}`}>
      <a className="underline-offset-4 hover:underline py-2" href="https://celox.io/impressum" target="_blank" rel="noreferrer">
        Impressum
      </a>
      <a className="underline-offset-4 hover:underline py-2" href="https://celox.io/datenschutz" target="_blank" rel="noreferrer">
        Datenschutz
      </a>
    </nav>
  )
}
