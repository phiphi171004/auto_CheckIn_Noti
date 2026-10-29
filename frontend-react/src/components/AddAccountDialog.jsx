import { useEffect, useRef, useState } from 'react'
import Dialog from './Dialog'
import { humanError, timeToCron } from '../lib/format'

const MODES = [
  { id: 'phone', label: 'Số điện thoại' },
  { id: 'google', label: 'Google' }
]

function generateDeviceId() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// Tokens arrive pasted from devtools, often wrapped in quotes or with line breaks.
function cleanToken(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
}

const EMPTY = {
  phoneNumber: '',
  password: '',
  googleIdToken: '',
  firebaseToken: '',
  deviceId: '',
  time: '06:00'
}

const DESCRIPTIONS = {
  phone:
    'Piggi đăng nhập bằng số điện thoại và tự chạy theo giờ bạn chọn.',
  google:
    'Dán Google ID token để thêm tài khoản hoặc làm mới phiên đăng nhập cũ.'
}

export default function AddAccountDialog({ open, busy, onClose, onSubmit }) {
  const [mode, setMode] = useState('phone')
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMode('phone')
      setForm({ ...EMPTY, deviceId: generateDeviceId() })
      setError('')
    }
  }, [open])

  // Switching method swaps the first field, so move focus with it.
  useEffect(() => {
    if (!open) return
    const target = formRef.current?.querySelector('[data-autofocus]')
    if (target) target.focus()
  }, [open, mode])

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const switchMode = (next) => {
    if (next === mode) return
    setMode(next)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    const deviceId = form.deviceId.trim()
    const cronSchedule = timeToCron(form.time)

    if (!cronSchedule) {
      setError('Chọn giờ điểm danh hợp lệ.')
      return
    }
    if (!deviceId) {
      setError('Nhập mã thiết bị.')
      return
    }

    try {
      if (mode === 'google') {
        const googleIdToken = cleanToken(form.googleIdToken)
        if (!googleIdToken) {
          setError('Dán Google ID token để đăng nhập.')
          return
        }
        await onSubmit({
          method: 'google',
          googleIdToken,
          firebaseToken: cleanToken(form.firebaseToken),
          deviceId,
          cronSchedule
        })
        return
      }

      const phoneNumber = form.phoneNumber.trim()
      if (!phoneNumber || !form.password) {
        setError('Nhập số điện thoại và mật khẩu.')
        return
      }
      await onSubmit({
        method: 'phone',
        phoneNumber,
        password: form.password,
        deviceId,
        cronSchedule
      })
    } catch (submitError) {
      setError(humanError(submitError, 'Không lưu được tài khoản.'))
    }
  }

  const isGoogle = mode === 'google'
  const submitLabel = isGoogle ? 'Lưu tài khoản' : 'Thêm tài khoản'
  const busyLabel = isGoogle ? 'Đang lưu' : 'Đang thêm'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={busy}
      title="Thêm tài khoản"
      description={DESCRIPTIONS[mode]}
    >
      <form className="form-grid" onSubmit={submit} noValidate ref={formRef}>
        <div className="segmented block" role="group" aria-label="Cách đăng nhập">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => switchMode(item.id)}
              disabled={busy}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isGoogle ? (
          <>
            <div className="field">
              <label htmlFor="add-google-token">Google ID token</label>
              <textarea
                id="add-google-token"
                className="input token-input"
                rows={3}
                placeholder="Dán token Google (JWT) tại đây"
                value={form.googleIdToken}
                onChange={update('googleIdToken')}
                spellCheck="false"
                autoComplete="off"
                disabled={busy}
                data-autofocus
                autoFocus
              />
              <p className="hint">
                Lấy từ bước đăng nhập Google của Piggi, không phải mật khẩu
                Google.
              </p>
            </div>

            <div className="field">
              <label htmlFor="add-firebase-token">
                Firebase token{' '}
                <span className="label-note">(tuỳ chọn)</span>
              </label>
              <textarea
                id="add-firebase-token"
                className="input token-input"
                rows={2}
                placeholder="Dán token Firebase / Cloudflare"
                value={form.firebaseToken}
                onChange={update('firebaseToken')}
                spellCheck="false"
                autoComplete="off"
                disabled={busy}
              />
              <p className="hint">
                Gửi kèm header x-cloudflare-ia khi máy chủ yêu cầu.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="add-phone">Số điện thoại</label>
              <input
                id="add-phone"
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0348 214 308"
                value={form.phoneNumber}
                onChange={update('phoneNumber')}
                disabled={busy}
                data-autofocus
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="add-password">Mật khẩu</label>
              <input
                id="add-password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Mật khẩu đăng nhập Piggi"
                value={form.password}
                onChange={update('password')}
                disabled={busy}
              />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="add-device">Mã thiết bị</label>
          <div className="input-row">
            <input
              id="add-device"
              className="input"
              value={form.deviceId}
              onChange={update('deviceId')}
              spellCheck="false"
              autoComplete="off"
              disabled={busy}
            />
            <button
              type="button"
              className="btn"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  deviceId: generateDeviceId()
                }))
              }
              disabled={busy}
            >
              Tạo mới
            </button>
          </div>
          <p className="hint">
            {isGoogle
              ? '16 ký tự hex của phiên Google. Giữ đúng mã cũ nếu bạn đã có.'
              : '16 ký tự hex cho phiên đăng nhập. Giữ mã cũ nếu bạn đã có.'}
          </p>
        </div>

        <div className="field">
          <label htmlFor="add-time">Giờ điểm danh hằng ngày</label>
          <input
            id="add-time"
            className="input"
            type="time"
            value={form.time}
            onChange={update('time')}
            disabled={busy}
            required
          />
          <p className="hint">Máy chủ chạy theo giờ này mỗi ngày.</p>
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
            {busy ? busyLabel : submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
