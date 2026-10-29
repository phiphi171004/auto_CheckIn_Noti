import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import PiggiMark from './PiggiMark'
import { formatClock } from '../lib/format'

const NAV = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'accounts', label: 'Tài khoản' },
  { id: 'history', label: 'Lịch sử' }
]

export default function Topbar({
  view,
  updatedAt,
  activeCount,
  checkingAll,
  onCheckinAll,
  onAdd
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    setOpen(false)
  }, [view])

  const close = useCallback(() => {
    setOpen(false)
    menuRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()

    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [close, open])

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#overview" aria-label="Piggi, về tổng quan">
            <PiggiMark size={30} />
            <span className="brand-word">Piggi</span>
            <span className="brand-sub">sổ điểm danh</span>
          </a>

          <nav className="topnav" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={view === item.id ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="topbar-actions">
            {updatedAt ? (
              <span className="stamp">Cập nhật {formatClock(updatedAt)}</span>
            ) : null}
            <button
              type="button"
              className="btn primary"
              onClick={onCheckinAll}
              disabled={checkingAll || activeCount === 0}
              title={
                activeCount === 0
                  ? 'Chưa có tài khoản đang chạy'
                  : 'Điểm danh mọi tài khoản đang chạy'
              }
            >
              <Icon name="check" size={16} />
              <span className="btn-label">
                {checkingAll ? 'Đang điểm danh' : 'Điểm danh'}
              </span>
            </button>
            <button
              ref={menuRef}
              type="button"
              className="icon-btn menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div
          ref={sheetRef}
          className="sheet"
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng"
          tabIndex={-1}
        >
          <div className="sheet-head">
            <span className="brand">
              <PiggiMark size={30} />
              <span className="brand-word">Piggi</span>
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={close}
              aria-label="Đóng menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav className="sheet-nav" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={view === item.id ? 'page' : undefined}
                onClick={close}
              >
                {item.label}
                {view === item.id ? <Icon name="check" size={16} /> : null}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="btn primary sheet-action"
            onClick={onCheckinAll}
            disabled={checkingAll || activeCount === 0}
          >
            <Icon name="check" size={16} />
            {checkingAll ? 'Đang điểm danh' : 'Điểm danh tất cả'}
          </button>
          <button
            type="button"
            className="btn sheet-action"
            onClick={() => {
              close()
              onAdd()
            }}
          >
            <Icon name="plus" size={16} />
            Thêm tài khoản
          </button>

          <p className="sheet-foot">
            {activeCount} tài khoản đang chạy
            {updatedAt ? ` · cập nhật ${formatClock(updatedAt)}` : ''}
          </p>
        </div>
      ) : null}
    </>
  )
}
