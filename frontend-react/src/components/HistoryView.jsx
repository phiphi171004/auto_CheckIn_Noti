import { useState } from 'react'
import EmptyState from './EmptyState'
import Pill from './Pill'
import {
  OUTCOME_LABEL,
  accountHint,
  formatDateTime,
  formatNumber,
  fullName,
  historyName,
  outcomeOf,
  withinDays
} from '../lib/format'

const RANGES = [
  { id: 7, label: '7 ngày' },
  { id: 30, label: '30 ngày' },
  { id: 0, label: 'Tất cả' }
]

const TONES = { success: 'positive', already: 'neutral', error: 'negative' }

export default function HistoryView({ accounts, history }) {
  const [range, setRange] = useState(30)
  const [accountId, setAccountId] = useState('all')

  const now = new Date()
  const filtered = history.filter((row) => {
    if (accountId !== 'all' && Number(row.account_id) !== Number(accountId)) {
      return false
    }
    if (range === 0) return true
    return withinDays(row.created_at, range, now)
  })

  const success = filtered.filter((row) => outcomeOf(row) === 'success').length
  const already = filtered.filter((row) => outcomeOf(row) === 'already').length
  const errors = filtered.filter((row) => outcomeOf(row) === 'error').length
  const successRate = filtered.length
    ? Math.round((success / filtered.length) * 100)
    : 0
  const rangeLabel = range === 0 ? 'toàn bộ' : `${range} ngày`
  const isFiltered = accountId !== 'all' || range !== 30

  const resetFilters = () => {
    setRange(30)
    setAccountId('all')
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Lịch sử</h1>
          <p className="sub">
            Gồm cả lượt bỏ qua vì đã điểm danh, để không đọc thành lỗi.
          </p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <p className="kpi-label">Tổng lượt</p>
          <p className="kpi-value">{formatNumber(filtered.length)}</p>
          <p className="kpi-note">Trong {rangeLabel}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Thành công</p>
          <p className="kpi-value">{formatNumber(success)}</p>
          <p className="kpi-note">{successRate}% tổng lượt</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Đã điểm danh</p>
          <p className="kpi-value">{formatNumber(already)}</p>
          <p className="kpi-note">Bỏ qua, không phải lỗi</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Lỗi</p>
          <p className="kpi-value">{formatNumber(errors)}</p>
          <p className="kpi-note">
            {errors > 0 ? 'Cần xem lại' : 'Không có lỗi'}
          </p>
        </div>
      </div>

      <div className="filters">
        <div className="segmented" role="group" aria-label="Khoảng thời gian">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <label className="sr-only" htmlFor="history-account">
          Lọc theo tài khoản
        </label>
        <select
          id="history-account"
          className="select"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
        >
          <option value="all">Tất cả tài khoản</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {fullName(account)}
            </option>
          ))}
        </select>
      </div>

      <section className="panel list-panel" aria-label="Lịch sử điểm danh">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              history.length === 0
                ? 'Chưa có lượt điểm danh'
                : 'Không có lượt nào trong khoảng này'
            }
            copy={
              history.length === 0
                ? 'Lượt tự động và thủ công sẽ được ghi lại ở đây sau lần chạy đầu tiên.'
                : 'Đổi khoảng thời gian hoặc chọn tài khoản khác.'
            }
            action={
              isFiltered ? (
                <button type="button" className="btn" onClick={resetFilters}>
                  Xem 30 ngày gần nhất
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl stack history-tbl">
                <caption className="sr-only">Lịch sử điểm danh</caption>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Tài khoản</th>
                    <th>Kết quả</th>
                    <th className="n">Coin trước → sau</th>
                    <th className="n">Chuỗi</th>
                    <th>Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const outcome = outcomeOf(row)
                    const hint = accountHint({ userName: row.user_name })

                    return (
                      <tr key={row.id}>
                        <td data-label="Thời gian">
                          <span className="cell-main num">
                            {formatDateTime(row.created_at)}
                          </span>
                        </td>
                        <td data-label="Tài khoản">
                          <span className="cell-id">
                            <strong>{historyName(row)}</strong>
                            <span className="cell-sub">{hint || '—'}</span>
                          </span>
                        </td>
                        <td data-label="Kết quả">
                          <span className="cell-id">
                            <Pill tone={TONES[outcome]}>
                              {OUTCOME_LABEL[outcome]}
                            </Pill>
                            {outcome === 'error' && row.error_message ? (
                              <span
                                className="cell-sub truncate"
                                title={row.error_message}
                              >
                                {row.error_message}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="n" data-label="Coin">
                          <span className="cell-coin">
                            {row.coin_before != null
                              ? formatNumber(row.coin_before)
                              : '—'}
                            <span className="unit">→</span>{' '}
                            {row.coin_after != null
                              ? formatNumber(row.coin_after)
                              : '—'}
                          </span>
                        </td>
                        <td className="n" data-label="Chuỗi">
                          <span className="num">
                            {row.checkin_streak != null
                              ? `${row.checkin_streak} ngày`
                              : '—'}
                          </span>
                        </td>
                        <td data-label="Nguồn">
                          {row.is_scheduled ? 'Tự động' : 'Thủ công'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="card-foot">
              <span className="panel-note">
                Hiển thị {filtered.length} / {history.length} lượt gần nhất.
              </span>
            </div>
          </>
        )}
      </section>
    </>
  )
}
