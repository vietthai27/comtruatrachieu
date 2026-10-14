import { useState } from 'react'
import { toast } from 'react-toastify'
import BankSelect from './BankSelect.jsx'
import useBanks from './useBanks.js'
import { api } from './lib.js'

const emptyRegister = { username: '', password: '', confirm: '', fullName: '', bankBin: '', accountNo: '' }

/** Màn hình đăng nhập / đăng ký. onAuth({ token, user }) khi thành công. */
export default function Auth({ onAuth, themeToggle }) {
  const [mode, setMode] = useState('login')
  const [login, setLogin] = useState({ username: '', password: '' })
  const [reg, setReg] = useState(emptyRegister)
  const [busy, setBusy] = useState(false)
  const { banks } = useBanks()

  const submit = async (e) => {
    e.preventDefault()
    if (mode === 'register' && reg.password !== reg.confirm) {
      toast.error('Mật khẩu nhập lại không khớp')
      return
    }
    setBusy(true)
    try {
      const body = mode === 'login'
        ? login
        : { username: reg.username, password: reg.password, fullName: reg.fullName, bankBin: reg.bankBin, accountNo: reg.accountNo }
      const res = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) })
      if (mode === 'register') toast.success('Đăng ký thành công')
      onAuth(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const setL = (k) => (e) => setLogin({ ...login, [k]: e.target.value })
  const setR = (k) => (e) => setReg({ ...reg, [k]: e.target.value })

  return (
    <div className="auth">
      {themeToggle}
      <div className="auth-brand">
        <span className="auth-logo">🍚</span>
        <h1>Cơm trưa trà chiều</h1>
        <p className="muted">Chia tiền nhanh, tạo QR chuyển khoản</p>
      </div>

      <div className="segmented" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}>Đăng nhập</button>
        <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}>Đăng ký</button>
      </div>

      <form className="card" onSubmit={submit}>
        {mode === 'login' ? (
          <>
            <label>Tên đăng nhập
              <input required autoComplete="username" autoCapitalize="none" value={login.username} onChange={setL('username')} />
            </label>
            <label>Mật khẩu
              <input required type="password" autoComplete="current-password" value={login.password} onChange={setL('password')} />
            </label>
          </>
        ) : (
          <>
            <label>Tên đăng nhập
              <input required autoComplete="username" autoCapitalize="none" pattern="[a-z0-9._]{3,30}"
                title="3–30 ký tự: chữ thường không dấu, số, dấu . hoặc _"
                value={reg.username} onChange={(e) => setReg({ ...reg, username: e.target.value.toLowerCase() })} />
            </label>
            <label>Mật khẩu
              <input required type="password" minLength={6} autoComplete="new-password" value={reg.password} onChange={setR('password')} />
            </label>
            <label>Nhập lại mật khẩu
              <input required type="password" minLength={6} autoComplete="new-password" value={reg.confirm} onChange={setR('confirm')} />
            </label>
            <hr />
            <label>Họ tên
              <input required autoComplete="name" value={reg.fullName} onChange={setR('fullName')} />
            </label>
            {/* div thay vì label: label sẽ chuyển click trong menu sang nút trigger */}
            <div className="field">Ngân hàng
              <BankSelect required banks={banks} value={reg.bankBin} onChange={(bankBin) => setReg({ ...reg, bankBin })} />
            </div>
            <label>Số tài khoản
              <input required inputMode="numeric" pattern="\d{4,30}" value={reg.accountNo} onChange={setR('accountNo')} />
            </label>
          </>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>
    </div>
  )
}
