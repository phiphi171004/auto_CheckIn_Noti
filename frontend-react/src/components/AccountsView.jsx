import { useState } from 'react'
import EmptyState from './EmptyState'
import Icon from './Icon'
import Pill from './Pill'
import StreakStrip from './StreakStrip'
import {
  accountHint,
  accountName,
  checkedToday,
  cronSummary,
  formatNumber,
  maxOf,
  nextRunLabel,
  totalOf
} from '../lib/format'

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang chạy' },
  { id: 'paused', label: 'Tạm dừng' }
]

export default function AccountsView({
  accounts,
  history,
  pending,
  onAdd,
  onCheckin,
  onToggle,
  onSchedule,
  onDelete
}) {
  const [filter, setFilter] = useState('all')

  const now = new Date()
  const active = accounts.filter((account) => account.isActive)
  const paused = accounts.filter((account) => !account.isActive)
  const filtered = accounts.filter((account) => {
    if (filter === 'active') return account.isActive
    if (filter === 'paused') return !account.isActive
    return true
  })

  const counts = { all: accounts.length, active: active.length, paused: paused.length }
  const totalCoin = totalOf(accounts, 'currentCoin')
  const accumulated = totalOf(accounts, 'accumulatedCoin')
  const pendingCoin = totalOf(accounts, 'pendingCoin')
  const maxStreak = maxOf(accounts, 'currentCheckin')
  const bestAccount = accounts.find(
    (account) => (Number(account.currentCheckin) || 0) === maxStreak && maxStreak > 0
  )

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Tài khoản</h1>
          <p className="sub">
            {accounts.length} tài khoản · {active.length} đang chạy
            {paused.length > 0 ? ` · ${paused.length} tạm dừng` : ''}
          </p>
        </div>
        <button type="button" className="btn primary" onClick={onAdd}>
          <Icon name="plus" size={16} />
          Thêm tài khoản
        </button>
      </div>

      <div className="kpis">
        <div className="kpi">
          <p className="kpi-label">Tổng coin</p>
          <p className="kpi-value">
            {formatNumber(totalCoin)}
            <small>coin</small>
          </p>
          <p className="kpi-note">{accounts.length} tài khoản</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Đã tích luỹ</p>
          <p className="kpi-value">
            {formatNumber(accumulated)}
            <small>coin</small>
          </p>
          <p className="kpi-note">
            {pendingCoin > 0
              ? `${formatNumber(pendingCoin)} coin đang chờ`
              : 'Không có coin chờ'}
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Chuỗi dài nhất</p>
          <p className="kpi-value">
            {formatNumber(maxStreak)}
            <small>ngày</small>
          </p>
          <p className="kpi-note">
            {bestAccount ? accountName(bestAccount) : 'Chưa có chuỗi'}
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Đang chạy</p>
          <p className="kpi-value">
            {active.length}
            <small>/ {accounts.length}</small>
          </p>
          <p className="kpi-note">
            {paused.length > 0 ? `${paused.length} tạm dừng` : 'Tất cả đang chạy'}
          </p>
        </div>
      </div>

      <div className="filters">
        <div className="segmented" role="group" aria-label="Lọc tài khoản">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label} ({counts[item.id]})
            </button>
          ))}
        </div>
        <span className="spacer" />
        <span className="filters-label">
          {filtered.length} tài khoản đang hiển thị
        </span>
      </div>

      <section className="panel list-panel" aria-label="Danh sách tài khoản">
        {accounts.length === 0 ? (
          <EmptyState
            title="Chưa có tài khoản nào"
            copy="Thêm tài khoản đầu tiên, chọn giờ chạy, rồi để Piggi điểm danh hằng ngày."
            action={
              <button type="button" className="btn primary" onClick={onAdd}>
                <Icon name="plus" size={16} />
                Thêm tài khoản
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Không có tài khoản trong nhóm này"
            copy="Đổi bộ lọc để xem toàn bộ danh sách."
            action={
              <button
                type="button"
                className="btn"
                onClick={() => setFilter('all')}
              >
                Xem tất cả
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="tbl stack">
              <caption className="sr-only">Danh sách tài khoản Piggi</caption>
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th className="n">Coin</th>
                  <th>Chuỗi 7 ngày</th>
                  <th>Lịch chạy</th>
                  <th>Trạng thái</th>
                  <th className="n">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => {
                  const checked = checkedToday(account.id, history, now)
                  const streak = Number(account.currentCheckin) || 0
                  const next = account.isActive
                    ? nextRunLabel(account.cronSchedule, now)
                    : null

                  const checkinBusy = pending.has(`checkin-${account.id}`)
                  const toggleBusy = pending.has(`toggle-${account.id}`)
                  const scheduleBusy = pending.has(`schedule-${account.id}`)

                  return (
                    <tr
                      key={account.id}
                      aria-busy={
                        checkinBusy || toggleBusy || scheduleBusy
                          ? 'true'
                          : undefined
                      }
                    >
                      <td data-label="Tài khoản">
                        <span className="cell-id">
                          <strong>{accountName(account)}</strong>
                          <span className="cell-sub">
                            {accountHint(account) || 'Chưa có tên Piggi'}
                          </span>
                        </span>
                      </td>

                      <td className="n" data-label="Coin">
                        <span className="cell-coin">
                          {formatNumber(account.currentCoin)}
                          <span className="unit">coin</span>
                        </span>
                      </td>

                      <td data-label="Chuỗi 7 ngày">
                        <span className="cell-streak">
                          <StreakStrip
                            value={streak}
                            today={checked}
                            label={`${accountName(account)}: chuỗi ${streak} trên 7 ngày`}
                          />
                          <span className="streak-count">
                            {streak > 0 ? `${streak} ngày` : 'Chưa có'}
                          </span>
                        </span>
                      </td>

                      <td data-label="Lịch chạy">
                        <span className="cell-id">
                          <span className="cell-main">
                            {cronSummary(account.cronSchedule)}
                          </span>
                          <span className="cell-sub">
                            {next
                              ? `Lần tới ${next.day} · ${next.time}`
                              : account.isActive
                                ? 'Không đọc được lịch'
                                : 'Tạm dừng, không chạy'}
                          </span>
                        </span>
                      </td>

                      <td data-label="Trạng thái">
                        <Pill tone={account.isActive ? 'positive' : 'neutral'}>
                          {account.isActive ? 'Đang chạy' : 'Tạm dừng'}
                        </Pill>
                      </td>

                      <td className="cell-actions" data-label="">
                        <span className="actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => onCheckin(account)}
                            disabled={!account.isActive || checkinBusy}
                            aria-label={`Điểm danh ${accountName(account)}`}
                            title={
                              account.isActive
                                ? 'Điểm danh ngay'
                                : 'Tài khoản đang tạm dừng'
                            }
                          >
                            <Icon name="check" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => onSchedule(account)}
                            disabled={scheduleBusy}
                            aria-label={`Đổi giờ chạy của ${accountName(account)}`}
                            title="Đổi giờ chạy"
                          >
                            <Icon name="calendar" size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            data-danger="true"
                            onClick={() => onDelete(account)}
                            disabled={pending.has(`delete-${account.id}`)}
                            aria-label={`Xoá ${accountName(account)}`}
                            title="Xoá tài khoản"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                          <input
                            type="checkbox"
                            className="switch"
                            role="switch"
                            checked={account.isActive}
                            onChange={() => onToggle(account)}
                            disabled={toggleBusy}
                            aria-label={
                              account.isActive
                                ? `Tạm dừng ${accountName(account)}`
                                : `Bật lại ${accountName(account)}`
                            }
                          />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
