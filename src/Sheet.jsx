import { useEffect } from 'react'

/** Bottom sheet kiểu mobile: phủ nền, trượt từ dưới lên, đóng khi chạm nền hoặc Esc. */
export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <b>{title}</b>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
