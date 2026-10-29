import { useEffect, useState } from 'react'
import Dialog from './Dialog'
import { humanError } from '../lib/format'

export default function ConfirmDialog({
  open,
  busy,
  accountLabel,
  onClose,
  onConfirm
}) {
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setError('')
  }, [open])

  const confirm = async () => {
    setError('')
    try {
      await onConfirm()
    } catch (confirmError) {
      setError(humanError(confirmError, 'Không xoá được tài khoản.'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="Xoá tài khoản?"
      description="Tài khoản rời lịch chạy ngay sau khi xoá."
    >
      <p className="dialog-copy">
        Xoá <strong>{accountLabel}</strong> và toàn bộ lịch sử điểm danh của tài
        khoản này. Không thể hoàn tác.
      </p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dialog-foot">
        <button
          type="button"
          className="btn ghost"
          onClick={onClose}
          disabled={busy}
          data-autofocus
          autoFocus
        >
          Giữ lại
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? 'Đang xoá' : 'Xoá tài khoản'}
        </button>
      </div>
    </Dialog>
  )
}
