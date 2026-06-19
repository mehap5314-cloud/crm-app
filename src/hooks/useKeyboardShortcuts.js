'use client'

import { useEffect } from 'react'

export default function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const down = (e) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && key === 'n') { e.preventDefault(); handlers.new?.() }
      else if (ctrl && key === 's') { e.preventDefault(); handlers.save?.() }
      else if (key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) { e.preventDefault(); handlers.search?.() }
      else if (key === 'escape') { handlers.escape?.() }
      else if (key === 'r' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) { handlers.refresh?.() }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [handlers])
}
