import { useEffect, useState } from 'react'
import SplitBill from './SplitBill.jsx'
import Members from './Members.jsx'
import Bills from './Bills.jsx'
import Groups from './Groups.jsx'
import Auth from './Auth.jsx'
import Account from './Account.jsx'
import Avatar from './Avatar.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import useTheme from './theme.js'
import { ToastContainer } from 'react-toastify'
import { api, getToken, LOGOUT_EVENT, setToken } from './lib.js'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const TABS = [
  { key: 'qr', label: 'Chia tiền',
    icon: 'M3 7h18v10H3zM7 7v10M17 7v10M12 10v4' },
  { key: 'bills', label: 'Hoá đơn',
    icon: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4' },
  { key: 'groups', label: 'Nhóm',
    icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5' },
  // chỉ admin; admin không gắn thành viên nên không dùng các tab chia tiền
  { key: 'members', label: 'Thành viên', adminOnly: true,
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
]

const isAdmin = (user) => user.role === 'ADMIN'
const tabsFor = (user) => TABS.filter((t) => Boolean(t.adminOnly) === isAdmin(user))

export default function App() {
  // undefined = đang kiểm tra phiên, null = chưa đăng nhập
  const [user, setUser] = useState(getToken() ? undefined : null)
  const [tab, setTab] = useState('qr')
  const [showAccount, setShowAccount] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const themeToggle = <ThemeToggle theme={theme} onToggle={toggleTheme} />

  useEffect(() => {
    if (getToken()) api('/api/auth/me').then(setUser).catch(() => setUser(null))
    const onLogout = () => setUser(null)
    window.addEventListener(LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [tab])

  const onAuth = ({ token, user }) => {
    setToken(token)
    setUser(user)
    setTab(tabsFor(user)[0].key)
  }

  const logout = () => {
    setToken(null)
    setShowAccount(false)
    setUser(null)
  }

  // ToastContainer luôn ở cùng vị trí trong cây để không bị mount lại (mất toast) khi chuyển đăng nhập <-> app
  return (
    <div className="app">
      {user === undefined ? <p className="empty-state">Đang tải...</p>
        : user === null ? <Auth onAuth={onAuth} themeToggle={themeToggle} />
        : <LoggedIn user={user} tab={tab} setTab={setTab} showAccount={showAccount}
            setShowAccount={setShowAccount} logout={logout} setUser={setUser} themeToggle={themeToggle} />}
      <ToastContainer position="top-center" autoClose={3500} theme="colored" newestOnTop limit={3} />
    </div>
  )
}

function LoggedIn({ user, tab, setTab, showAccount, setShowAccount, logout, setUser, themeToggle }) {
  const tabs = tabsFor(user)
  // tab đang nhớ có thể không thuộc quyền của tài khoản này (vd. vừa đổi tài khoản)
  const active = tabs.some((t) => t.key === tab) ? tab : tabs[0].key
  return (
    <>
      <header className="app-header">
        <span>Cơm trưa trà chiều</span>
        <span className="header-actions">
          {themeToggle}
          <button className="header-avatar" onClick={() => setShowAccount(true)} aria-label="Tài khoản">
            <Avatar name={user.member?.fullName ?? user.username} size={34} />
          </button>
        </span>
      </header>
      <main className="app-content">
        {active === 'qr' && <SplitBill me={user.member} />}
        {active === 'bills' && <Bills />}
        {active === 'groups' && <Groups me={user.member} />}
        {active === 'members' && <Members me={user.member} />}
      </main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <button key={t.key} className={active === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            <Icon d={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      {showAccount && <Account user={user} onClose={() => setShowAccount(false)} onLogout={logout} onUpdated={setUser} />}
    </>
  )
}
