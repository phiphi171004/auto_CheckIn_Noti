import { useCallback, useEffect, useState } from 'react'
import AccountsView from './components/AccountsView'
import AddAccountDialog from './components/AddAccountDialog'
import ConfirmDialog from './components/ConfirmDialog'
import HistoryView from './components/HistoryView'
import Icon from './components/Icon'
import Overview from './components/Overview'
import ScheduleDialog from './components/ScheduleDialog'
import Toast from './components/Toast'
import Topbar from './components/Topbar'
import { api } from './lib/api'
import {
  accountName,
  checkinTone,
  coinDelta,
  cronSummary,
  describeCheckin,
  formatNumber,
  humanError,
  resultOutcome
} from './lib/format'

const VIEWS = ['overview', 'accounts', 'history']
const TITLES = {
  overview: 'Tổng quan',
  accounts: 'Tài khoản',
  history: 'Lịch sử'
}

function readView() {
  const hash = window.location.hash.replace('#', '')
  return VIEWS.includes(hash) ? hash : 'overview'
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-sub" />
      <div className="skeleton-kpis">
        <div className="skeleton skeleton-kpi" />
        <div className="skeleton skeleton-kpi" />
        <div className="skeleton skeleton-kpi" />
        <div className="skeleton skeleton-kpi" />
      </div>
      <div className="skeleton-panels">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton-stack">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState(readView)
  const [accounts, setAccounts] = useState(null)
  const [history, setHistory] = useState([])
  const [loadError, setLoadError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [pending, setPending] = useState(() => new Set())
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    try {
      const [accountData, historyData] = await Promise.all([
        api.accounts(),
        api.history(100)
      ])
      setAccounts(accountData.accounts || [])
      setHistory(historyData.history || [])
      setUpdatedAt(new Date())
      setLoadError('')
    } catch (error) {
      if (silent) return
      setLoadError(humanError(error))
      throw error
    }
  }, [])

  useEffect(() => {
    loadAll().catch(() => {})
    const timer = setInterval(() => {
      loadAll({ silent: true }).catch(() => {})
    }, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [loadAll])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#overview')
    }

    const onHash = () => {
      setView(readView())
      window.scrollTo(0, 0)
    }

    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = `${TITLES[view]} · Piggi`
  }, [view])

  const notify = useCallback((message, tone = 'neutral') => {
    setToast({ id: `${Date.now()}-${Math.random()}`, message, tone })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const run = useCallback(async (key, work) => {
    setPending((current) => {
      const next = new Set(current)
      next.add(key)
      return next
    })
    try {
      return await work()
    } finally {
      setPending((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }, [])

  const handleCheckinAll = useCallback(async () => {
    await run('all', async () => {
      try {
        const data = await api.checkinAll()
        const results = data.results || []
        await loadAll({ silent: true })
        notify(describeCheckin(results), checkinTone(results))
      } catch (error) {
        notify(humanError(error, 'Không điểm danh được.'), 'negative')
      }
    })
  }, [loadAll, notify, run])

  const handleCheckin = useCallback(
    async (account) => {
      await run(`checkin-${account.id}`, async () => {
        try {
          const data = await api.checkin(account.id)
          const result = data.result || {}
          await loadAll({ silent: true })

          const outcome = resultOutcome(result)
          const name = accountName(account)

          if (outcome === 'success') {
            const delta = coinDelta(result.coinBefore, result.coinAfter)
            notify(
              `${name} đã điểm danh${delta > 0 ? `, +${formatNumber(delta)} coin` : ''}.`,
              'positive'
            )
          } else if (outcome === 'already') {
            notify(`${name} đã điểm danh hôm nay.`, 'neutral')
          } else {
            notify(
              `${name}: ${humanError(
                { message: result.error },
                'Điểm danh thất bại.'
              )}`,
              'negative'
            )
          }
        } catch (error) {
          notify(humanError(error, 'Không điểm danh được.'), 'negative')
        }
      })
    },
    [loadAll, notify, run]
  )

  const handleToggle = useCallback(
    async (account) => {
      const next = !account.isActive
      await run(`toggle-${account.id}`, async () => {
        try {
          await api.setActive(account.id, next)
          await loadAll({ silent: true })
          notify(
            next
              ? `Đã bật lại ${accountName(account)}.`
              : `Đã tạm dừng ${accountName(account)}.`,
            next ? 'positive' : 'neutral'
          )
        } catch (error) {
          notify(humanError(error, 'Không đổi được trạng thái.'), 'negative')
        }
      })
    },
    [loadAll, notify, run]
  )

  const handleAdd = useCallback(
    (payload) =>
      run('add', async () => {
        const { method, ...fields } = payload
        const data =
          method === 'google'
            ? await api.addGoogleAccount(fields)
            : await api.addAccount(fields)

        await loadAll({ silent: true })
        setDialog(null)

        const label = accountName({
          id: data.account?.id,
          phoneNumber: data.account?.phoneNumber || fields.phoneNumber
        })

        if (method === 'google' && data.account?.isNewUser === false) {
          notify(`Đã cập nhật ${label}.`, 'positive')
        } else {
          notify(`Đã thêm ${label}.`, 'positive')
        }
      }),
    [loadAll, notify, run]
  )

  const handleSchedule = useCallback(
    (account, cronSchedule) =>
      run(`schedule-${account.id}`, async () => {
        await api.setSchedule(account.id, cronSchedule)
        await loadAll({ silent: true })
        setDialog(null)
        notify(
          `Đã lưu lịch cho ${accountName(account)}: ${cronSummary(cronSchedule)}.`,
          'positive'
        )
      }),
    [loadAll, notify, run]
  )

  const handleDelete = useCallback(
    (account) =>
      run(`delete-${account.id}`, async () => {
        await api.removeAccount(account.id)
        await loadAll({ silent: true })
        setDialog(null)
        notify(`Đã xoá ${accountName(account)}.`, 'neutral')
      }),
    [loadAll, notify, run]
  )

  const openAdd = useCallback(() => setDialog({ type: 'add' }), [])
  const openSchedule = useCallback(
    (account) => setDialog({ type: 'schedule', account }),
    []
  )
  const openDelete = useCallback(
    (account) => setDialog({ type: 'delete', account }),
    []
  )
  const closeDialog = useCallback(() => setDialog(null), [])

  const activeCount = accounts ? accounts.filter((item) => item.isActive).length : 0
  const ready = accounts !== null

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Bỏ qua điều hướng
      </a>

      <Topbar
        view={view}
        updatedAt={updatedAt}
        activeCount={activeCount}
        checkingAll={pending.has('all')}
        onCheckinAll={handleCheckinAll}
        onAdd={openAdd}
      />

      <main id="main" className="page" tabIndex={-1}>
        {!ready && loadError ? (
          <div className="banner" role="alert">
            <span className="banner-icon">
              <Icon name="alert" size={18} />
            </span>
            <div>
              <p className="banner-title">Không tải được dữ liệu</p>
              <p>{loadError}</p>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setLoadError('')
                loadAll().catch(() => {})
              }}
            >
              Thử lại
            </button>
          </div>
        ) : !ready ? (
          <PageSkeleton />
        ) : view === 'accounts' ? (
          <AccountsView
            accounts={accounts}
            history={history}
            pending={pending}
            onAdd={openAdd}
            onCheckin={handleCheckin}
            onToggle={handleToggle}
            onSchedule={openSchedule}
            onDelete={openDelete}
          />
        ) : view === 'history' ? (
          <HistoryView accounts={accounts} history={history} />
        ) : (
          <Overview accounts={accounts} history={history} onAdd={openAdd} />
        )}
      </main>

      <AddAccountDialog
        open={dialog?.type === 'add'}
        busy={pending.has('add')}
        onClose={closeDialog}
        onSubmit={handleAdd}
      />

      <ScheduleDialog
        open={dialog?.type === 'schedule'}
        account={dialog?.type === 'schedule' ? dialog.account : null}
        busy={
          dialog?.type === 'schedule'
            ? pending.has(`schedule-${dialog.account.id}`)
            : false
        }
        onClose={closeDialog}
        onSubmit={(cronSchedule) =>
          handleSchedule(dialog.account, cronSchedule)
        }
      />

      <ConfirmDialog
        open={dialog?.type === 'delete'}
        accountLabel={
          dialog?.type === 'delete' ? accountName(dialog.account) : ''
        }
        busy={
          dialog?.type === 'delete'
            ? pending.has(`delete-${dialog.account.id}`)
            : false
        }
        onClose={closeDialog}
        onConfirm={() => handleDelete(dialog.account)}
      />

      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onDone={dismissToast}
        />
      ) : null}
    </div>
  )
}
