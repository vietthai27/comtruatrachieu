import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Dropdown chọn ngân hàng có logo + ô tìm kiếm. value/onChange dùng BIN. */
export default function BankSelect({ banks, value, onChange, required }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const selected = banks.find((b) => b.bin === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return banks
    return banks.filter((b) =>
      [b.name, b.shortName, b.code, b.bin].some((v) => String(v ?? '').toLowerCase().includes(q)),
    )
  }, [banks, query])

  useEffect(() => {
    if (!open) return
    // Chỉ tự focus ô tìm kiếm khi có chuột; trên điện thoại focus sẽ bật bàn phím che danh sách,
    // đồng thời bỏ focus ô đang nhập (vd. Họ tên) để bàn phím đang mở cũng đóng lại
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus()
    else document.activeElement?.blur()
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const pick = (b) => {
    onChange(b.bin)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) pick(filtered[active]) }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
  }

  return (
    <div className="bank-select" ref={rootRef}>
      <button type="button" className="bank-select-trigger" onClick={() => setOpen(!open)}>
        {selected ? (
          <>
            <img src={selected.logo} alt="" />
            <span><b>{selected.shortName}</b> <small>{selected.name}</small></span>
          </>
        ) : (
          <span className="placeholder">-- Chọn ngân hàng --</span>
        )}
        <span className="caret">▾</span>
      </button>
      {/* giữ validation "required" của form */}
      <input className="bank-select-proxy" tabIndex={-1} required={required} value={value} onChange={() => {}}
        onFocus={() => setOpen(true)} />
      {open && createPortal(<>
        <div className="bank-select-backdrop" onMouseDown={() => setOpen(false)} />
        <div className="bank-select-menu">
          <div className="sheet-head">
            <b>Chọn ngân hàng</b>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </div>
          <input ref={searchRef} type="search" placeholder="Tìm ngân hàng..." value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} />
          <ul ref={listRef}>
            {filtered.map((b, i) => (
              <li key={b.id}
                className={`${i === active ? 'active' : ''} ${b.bin === value ? 'selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(b) }}>
                <img src={b.logo} alt="" loading="lazy" />
                <span><b>{b.shortName}</b> <small>{b.name}</small></span>
              </li>
            ))}
            {filtered.length === 0 && <li className="empty">Không tìm thấy</li>}
          </ul>
        </div>
      </>, document.body)}
    </div>
  )
}
