import EmptyState from './EmptyState'
import Icon from './Icon'
import StreakStrip from './StreakStrip'
import {
  OUTCOME_LABEL,
  accountHint,
  accountName,
  checkedToday,
  checkinTodayCount,
  cronSummary,
  formatNumber,
  formatShort,
  historyName,
  nextRunLabel,
  outcomeOf,
  todayHeading,
  totalOf
} from '../lib/format'

function TreeRow({ account, checked }) {
  const status = account.isActive
    ? checked
      ? 'Đã điểm danh hôm nay'
      : 'Chưa điểm danh hôm nay'
    : 'Tạm dừng'
  const hint = [accountHint(account), status].filter(Boolean).join(' · ')

  return (
    <a
      className="tree-row"
      href="#accounts"
      data-paused={!account.isActive ? 'true' : undefined}
      aria-label={`${accountName(account)}: ${formatNumber(account.currentCoin)} coin, ${hint}`}
    >
      <span className="tree-main">
        <span className="tree-name">{accountName(account)}</span>
        <span className="tree-hint">{hint}</span>
      </span>
      <span className="tree-value">{formatNumber(account.currentCoin)}</span>
    </a>
  )
}

export default function Overview({ accounts, history, onAdd }) {
  const now = new Date()
  const active = accounts.filter((account) => account.isActive)
  const paused = accounts.filter((account) => !account.isActive)
  const checkedCount = checkinTodayCount(accounts, history, now)
  const remainingActive = active.filter(
    (account) => !checkedToday(account.id, history, now)
  ).length
  const recent = history.slice(0, 3)
  const totalCoin = totalOf(accounts, 'currentCoin')
  const accumulated = totalOf(accounts, 'accumulatedCoin')

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Tổng quan</h1>
          <p className="sub">Sổ điểm danh hằng ngày của các tài khoản Piggi.</p>
        </div>
      </div>

      <div className="overview-grid">
      <section className="panel accounts-panel" aria-labelledby="coins-heading">
        <header>
          <h2 id="coins-heading">Tổng coin</h2>
          <span className="meta">{accounts.length} tài khoản</span>
        </header>

        <p className="sum">
          {formatNumber(totalCoin)}
          <span className="sum-unit">coin</span>
        </p>
        <p className="panel-note">
          Đã tích luỹ {formatNumber(accumulated)} coin
        </p>

        <div className="tree">
          <p className="group-label">
            Đang chạy <span>{active.length}</span>
          </p>
          {active.length === 0 ? (
            <p className="tree-empty">
              Chưa có tài khoản đang chạy. Bật lại hoặc thêm tài khoản mới.
            </p>
          ) : (
            active.map((account) => (
              <TreeRow
                key={account.id}
                account={account}
                checked={checkedToday(account.id, history, now)}
              />
            ))
          )}

          {paused.length > 0 ? (
            <>
              <p className="group-label">
                Tạm dừng <span>{paused.length}</span>
              </p>
              {paused.map((account) => (
                <TreeRow
                  key={account.id}
                  account={account}
                  checked={checkedToday(account.id, history, now)}
                />
              ))}
            </>
          ) : null}
        </div>

        <button type="button" className="add-link" onClick={onAdd}>
          <Icon name="plus" size={14} />
          Thêm tài khoản
        </button>
      </section>

      <div className="right-grid">
        <section className="panel span-2" aria-labelledby="today-heading">
          <header>
            <h2 id="today-heading">Hôm nay</h2>
            <span className="meta">{todayHeading(now)}</span>
          </header>

          {accounts.length === 0 ? (
            <EmptyState
              title="Chưa có tài khoản nào"
              copy="Thêm tài khoản Piggi đầu tiên để bắt đầu ghi sổ điểm danh."
              action={
                <button type="button" className="btn primary" onClick={onAdd}>
                  <Icon name="plus" size={16} />
                  Thêm tài khoản
                </button>
              }
            />
          ) : (
            <>
              <div className="today-head">
                <p className="statement">
                  {checkedCount}/{accounts.length}{' '}
                  <span>tài khoản đã điểm danh</span>
                </p>
                <p className="today-note">
                  {active.length} tài khoản đang chạy
                  {remainingActive > 0
                    ? ` · còn ${remainingActive} chưa điểm danh`
                    : ' · tất cả đã điểm danh'}
                  {paused.length > 0 ? ` · ${paused.length} tạm dừng` : ''}
                </p>
              </div>

              <ul className="streak-list">
                {accounts.map((account) => {
                  const checked = checkedToday(account.id, history, now)
                  const streak = Number(account.currentCheckin) || 0

                  return (
                    <li className="streak-row" key={account.id}>
                      <span className="streak-main">
                        <span className="streak-title">
                          {accountName(account)}
                        </span>
                        <span className="streak-sub">
                          {accountHint(account)
                            ? `${accountHint(account)} · `
                            : ''}
                          {account.isActive
                            ? checked
                              ? 'Đã điểm danh'
                              : 'Chưa điểm danh'
                            : 'Tạm dừng'}
                        </span>
                      </span>
                      <StreakStrip
                        value={streak}
                        today={checked}
                        label={`${accountName(account)}: chuỗi ${streak} trên 7 ngày`}
                      />
                      <span className="streak-days">
                        {streak > 0 ? `${streak} ngày` : 'Chưa có'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {accounts.length > 0 ? (
            <div className="card-foot">
              <a className="card-link" href="#accounts">
                Quản lý tài khoản
              </a>
            </div>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="recent-heading">
          <header>
            <h2 id="recent-heading">Điểm danh gần đây</h2>
            <span className="meta">Mới nhất trước</span>
          </header>

          {recent.length === 0 ? (
            <EmptyState
              title="Chưa có lượt nào"
              copy="Lượt điểm danh tự động và thủ công sẽ xuất hiện ở đây."
            />
          ) : (
            <>
              <ul className="feed">
                {recent.map((row) => {
                  const outcome = outcomeOf(row)
                  const error = row.error_message

                  return (
                    <li className="feed-row" key={row.id}>
                      <span className="feed-main">
                        <span className="feed-title">{historyName(row)}</span>
                        <span
                          className="feed-sub"
                          title={outcome === 'error' ? error : undefined}
                        >
                          {OUTCOME_LABEL[outcome]} ·{' '}
                          {row.is_scheduled ? 'tự động' : 'thủ công'}
                        </span>
                      </span>
                      <span className="feed-right">
                        <span className="feed-value">
                          {row.coin_after != null
                            ? `${formatNumber(row.coin_after)} coin`
                            : '—'}
                        </span>
                        <span className="feed-time">
                          {formatShort(row.created_at)}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="card-foot">
                <a className="card-link" href="#history">
                  Xem tất cả
                </a>
              </div>
            </>
          )}
        </section>

        <section className="panel" aria-labelledby="schedule-heading">
          <header>
            <h2 id="schedule-heading">Lịch chạy</h2>
            <span className="meta">Giờ máy chủ</span>
          </header>

          {accounts.length === 0 ? (
            <EmptyState
              title="Chưa có lịch"
              copy="Lịch chạy được đặt khi bạn thêm tài khoản."
            />
          ) : (
            <>
              <ul className="sched">
                {accounts.map((account) => {
                  const next = account.isActive
                    ? nextRunLabel(account.cronSchedule, now)
                    : null

                  return (
                    <li
                      className="sched-row"
                      key={account.id}
                      data-paused={!account.isActive ? 'true' : undefined}
                    >
                      <span className="sched-main">
                        <span className="feed-title">
                          {accountName(account)}
                        </span>
                        <span className="feed-sub">
                          {cronSummary(account.cronSchedule)}
                        </span>
                      </span>
                      <span className="sched-right">
                        <span className="feed-value">
                          {next ? next.time : '—'}
                        </span>
                        <span className="feed-time">
                          {next
                            ? next.day
                            : account.isActive
                              ? 'Không đọc được lịch'
                              : 'Tạm dừng'}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="card-foot">
                <a className="card-link" href="#accounts">
                  Quản lý lịch
                </a>
              </div>
            </>
          )}
        </section>
      </div>
      </div>
    </>
  )
}
