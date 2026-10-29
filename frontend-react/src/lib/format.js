const LOCALE = 'vi-VN'
// No timezone conversion needed - DB stores VN time directly

export const WEEKDAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy'
]

export const OUTCOME_LABEL = {
  success: 'Thành công',
  already: 'Đã điểm danh',
  error: 'Lỗi'
}

const pad = (value) => String(value).padStart(2, '0')

export function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString(LOCALE) : '—'
}

export function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return String(phone || '')
}

export function accountName(account) {
  if (!account) return 'Tài khoản'
  
  // Priority: email > phone > fallback ID
  if (account.email) return account.email
  if (account.phoneNumber) return formatPhone(account.phoneNumber)
  return `Tài khoản #${account.id}`
}

export function accountHint(account) {
  // Don't show hint if email is already displayed as name
  if (account?.email) return ''
  
  const userName = account?.userName || ''
  
  // Show userName only if no email
  if (userName) {
    if (/^\*+/.test(userName)) {
      const tail = userName.replace(/\*+/g, '').slice(-4)
      return tail ? `••••${tail}` : ''
    }
    return userName
  }
  
  return ''
}

export function fullName(account) {
  const hint = accountHint(account)
  return hint ? `${accountName(account)} · ${hint}` : accountName(account)
}

export function historyName(row) {
  return accountName({
    id: row?.account_id,
    phoneNumber: row?.phone_number,
    userName: row?.user_name,
    email: row?.email
  })
}

export function outcomeOf(row) {
  if (row?.success) return 'success'
  if (/đã điểm danh/i.test(row?.error_message || '')) return 'already'
  return 'error'
}

export function resultOutcome(result) {
  if (result?.success) return 'success'
  if (/đã điểm danh/i.test(result?.error || '')) return 'already'
  return 'error'
}

export function coinDelta(before, after) {
  const a = Number(before)
  const b = Number(after)
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : null
}

export function startOfDay(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function checkedToday(accountId, history, now = new Date()) {
  return (history || []).some((row) => {
    if (Number(row.account_id) !== Number(accountId)) return false
    const date = new Date(row.created_at)
    if (Number.isNaN(date.getTime())) return false
    return isSameDay(date, now) && outcomeOf(row) !== 'error'
  })
}

export function checkinTodayCount(accounts, history, now = new Date()) {
  return (accounts || []).filter((account) => checkedToday(account.id, history, now))
    .length
}

export function totalOf(list, key) {
  return (list || []).reduce((sum, item) => sum + (Number(item?.[key]) || 0), 0)
}

export function maxOf(list, key) {
  return (list || []).reduce(
    (max, item) => Math.max(max, Number(item?.[key]) || 0),
    0
  )
}

export function formatClock(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—'
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateTime(value) {
  if (!value) return '—'
  
  // Parse as UTC since DB stores VN time but without timezone info
  // When JavaScript parses it, it treats as UTC, then converts to local (+7)
  // We need to subtract 7 hours to get back to original VN time
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  
  // Subtract timezone offset to display the original DB time
  const offsetMs = 7 * 60 * 60 * 1000 // 7 hours in milliseconds
  const vnDate = new Date(date.getTime() - offsetMs)
  
  return `${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)}/${vnDate.getFullYear()} · ${pad(vnDate.getHours())}:${pad(vnDate.getMinutes())}`
}

export function formatShort(value) {
  if (!value) return '—'
  
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  
  // Subtract 7 hours to display original VN time from DB
  const offsetMs = 7 * 60 * 60 * 1000
  const vnDate = new Date(date.getTime() - offsetMs)
  
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(vnDate, now)) return `Hôm nay · ${formatClock(vnDate)}`
  if (isSameDay(vnDate, yesterday)) return `Hôm qua · ${formatClock(vnDate)}`
  return `${pad(vnDate.getDate())}/${pad(vnDate.getMonth() + 1)} · ${formatClock(vnDate)}`
}

export function todayHeading(now = new Date()) {
  return `${WEEKDAYS[now.getDay()]}, ${pad(now.getDate())}/${pad(now.getMonth() + 1)}`
}

export function withinDays(value, days, now = new Date()) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const from = startOfDay(now)
  from.setDate(from.getDate() - (days - 1))
  return date >= from
}

/* ---------- cron: the backend stores five-field cron strings ---------- */

export function parseCron(cron) {
  const parts = String(cron || '').trim().split(/\s+/)
  if (parts.length !== 5) return null

  const [minuteRaw, hourRaw, dayOfMonth, month, dayOfWeek] = parts
  const minute = Number(minuteRaw)
  const hour = Number(hourRaw)

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (dayOfMonth !== '*' || month !== '*') return null
  if (dayOfWeek !== '*' && !/^[0-6]$/.test(dayOfWeek)) return null

  return {
    minute,
    hour,
    dayOfWeek: dayOfWeek === '*' ? null : Number(dayOfWeek)
  }
}

export function cronSummary(cron) {
  const parsed = parseCron(cron)
  if (!parsed) return cron ? `Theo lịch ${cron}` : 'Chưa đặt lịch'

  const time = `${pad(parsed.hour)}:${pad(parsed.minute)}`
  if (parsed.dayOfWeek === null) return `Hằng ngày · ${time}`
  return `${WEEKDAYS[parsed.dayOfWeek]} · ${time}`
}

export function nextRunAt(cron, from = new Date()) {
  const parsed = parseCron(cron)
  if (!parsed) return null

  const next = new Date(from)
  next.setHours(parsed.hour, parsed.minute, 0, 0)

  if (parsed.dayOfWeek === null) {
    if (next <= from) next.setDate(next.getDate() + 1)
    return next
  }

  const delta = (parsed.dayOfWeek - next.getDay() + 7) % 7
  next.setDate(next.getDate() + delta)
  if (next <= from) next.setDate(next.getDate() + 7)
  return next
}

export function nextRunLabel(cron, from = new Date()) {
  const next = nextRunAt(cron, from)
  if (!next) return null

  const today = new Date(from)
  const tomorrow = new Date(from)
  tomorrow.setDate(today.getDate() + 1)

  let day = WEEKDAYS[next.getDay()].toLowerCase()
  if (isSameDay(next, today)) day = 'hôm nay'
  else if (isSameDay(next, tomorrow)) day = 'mai'

  return { time: formatClock(next), day }
}

export function cronToTime(cron) {
  const parsed = parseCron(cron)
  if (!parsed) return '06:00'
  return `${pad(parsed.hour)}:${pad(parsed.minute)}`
}

export function timeToCron(value) {
  const [hourRaw, minuteRaw] = String(value || '').split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  return `${minute} ${hour} * * *`
}

export function humanError(error, fallback = 'Không kết nối được máy chủ.') {
  const raw = error?.message || ''
  if (/failed to fetch|networkerror|load failed|không kết nối/i.test(raw)) {
    return 'Không kết nối được máy chủ. Kiểm tra backend rồi thử lại.'
  }
  if (/duplicate key|already exists|trùng/i.test(raw)) {
    return 'Số điện thoại này đã có trong danh sách.'
  }
  if (/account is inactive/i.test(raw)) return 'Tài khoản đang tạm dừng.'
  if (/account not found/i.test(raw)) return 'Không tìm thấy tài khoản này.'
  return raw || fallback
}

export function describeCheckin(results) {
  const list = Array.isArray(results) ? results : []
  if (list.length === 0) return 'Không có tài khoản nào đang chạy.'

  const success = list.filter((item) => item.success).length
  const already = list.filter((item) => resultOutcome(item) === 'already').length
  const failed = list.length - success - already

  const parts = []
  if (success) parts.push(`${success} tài khoản vừa điểm danh`)
  if (already) parts.push(`${already} tài khoản đã điểm danh trước đó`)
  if (failed) parts.push(`${failed} tài khoản lỗi`)

  return `${parts.join(' · ')}.`
}

export function checkinTone(results) {
  const list = Array.isArray(results) ? results : []
  if (list.some((item) => resultOutcome(item) === 'error')) return 'negative'
  if (list.some((item) => resultOutcome(item) === 'already')) return 'neutral'
  return 'positive'
}
