import { useEffect, useState } from 'react'
import Dialog from './Dialog'
import {
  accountName,
  cronSummary,
  cronToTime,
  humanError,
  parseCron,
  timeToCron
} from '../lib/format'

const PRESETS = ['06:00', '07:30', '12:00', '20:00']

export default function ScheduleDialog({
  open,
  account,
  busy,
  onClose,
  onSubmit
}) {
  const [time, setTime] = useState('06:00')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTime(cronToTime(account?.cronSchedule))
    setError('')
  }, [open, account])

  const current = account ? cronSummary(account.cronSchedule) : ''
  const wasDaily = account ? parseCron(account.cronSchedule)?.dayOfWeek === null : true

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    const cronSchedule = timeToCron(time)
    if (!cronSchedule) {
      setError('Chọn giờ chạy hợp lệ.')
      return
    }

    try {
      await onSubmit(cronSchedule)
    } catch (submitError) {
      setError(humanError(submitError, 'Không đổi được giờ chạy.'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="Đổi giờ chạy"
      description={account ? `${accountName(account)} · hiện tại ${current}` : undefined}
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="schedule-time">Giờ điểm danh hằng ngày</label>
          <input
            id="schedule-time"
            className="input"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            disabled={busy}
            required
            data-autofocus
            autoFocus
          />
          <div className="presets" aria-label="Giờ thường dùng">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip"
                aria-pressed={time === preset}
                onClick={() => setTime(preset)}
                disabled={busy}
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="hint">
            {wasDaily
              ? 'Lịch chạy mỗi ngày, kể cả cuối tuần.'
              : 'Lịch hiện tại không phải hằng ngày; lưu sẽ đổi sang hằng ngày.'}
          </p>
        </div>

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
          >
            Huỷ
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? 'Đang lưu' : 'Lưu giờ chạy'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
