/**
 * Scroll-triggered reveals for CSS entrances.
 *
 * `.stagger-children` grids and `[data-reveal]` blocks hold their spring
 * keyframes on the first frame (paused) until they scroll into view, then
 * play once. Content below the fold therefore animates when the reader gets
 * there — not invisibly on page load. Without IntersectionObserver everything
 * is revealed immediately (never hidden content).
 */
import { useEffect } from 'react'

const SELECTOR = '.stagger-children, [data-reveal]'

export function useScrollReveal(): void {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add('in-view')

    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll(SELECTOR).forEach(reveal)
      const mo = new MutationObserver(() => document.querySelectorAll(SELECTOR).forEach(reveal))
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target)
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 }
    )
    const watched = new WeakSet<Element>()
    const scan = () =>
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (watched.has(el) || el.classList.contains('in-view')) return
        watched.add(el)
        io.observe(el)
      })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])
}
