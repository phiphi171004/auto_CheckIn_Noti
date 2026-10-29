import { useEffect, useId, useRef } from 'react'
import Icon from './Icon'

export default function Dialog({
  open,
  onClose,
  title,
  description,
  busy = false,
  children
}) {
  const ref = useRef(null)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      // showModal focuses the close button first; a form wants its first field.
      const target = dialog.querySelector('[data-autofocus], [autofocus]')
      if (target) target.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return undefined

    const handleCancel = (event) => {
      event.preventDefault()
      if (!busy) onClose()
    }

    const handleClick = (event) => {
      if (busy) return
      // A click on the backdrop targets the dialog itself; real clicks on controls
      // arrive from a child. Keyboard activation reports (0, 0), so coordinates
      // would close the dialog on Enter or Space.
      if (event.target === dialog) onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [busy, onClose])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descriptionId}>{description}</p> : null}
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          disabled={busy}
          aria-label="Đóng"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>
  )
}
