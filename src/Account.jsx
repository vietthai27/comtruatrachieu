import { useState } from 'react'
import { toast } from 'react-toastify'
import Sheet from './Sheet.jsx'
import Avatar from './Avatar.jsx'
import BankTag from './BankTag.jsx'
import BankSelect from './BankSelect.jsx'
import useBanks from './useBanks.js'
import { api } from './lib.js'

const emptyPw = { currentPassword: '', newPassword: '', confirm: '' }

/** Tài khoản đang đăng nhập: sửa thông tin của mình, đổi mật khẩu, đăng xuất. */
export default function Account({ user, onClose, onLogout, onUpdated }) {
  const { member } = user
  // admin không gắn thành viên nên chỉ có phần đổi mật khẩu
  const [section, setSection] = useState(member ? 'profile' : 'password')
  const { banks, bankByBin } = useBanks()

  return (
    <Sheet title="Tài khoản" onClose={onClose}>
      <div className="stack">
        <div className="account-head">
          <Avatar name={member?.fullName ?? user.username} size={64} />
          <b>{member?.fullName ?? 'Quản trị viên'}</b>
          <span className="muted">@{user.username}</span>
          {user.role === 'ADMIN' && <small className="badge">Admin</small>}
          {member && (
            <span className="muted account-bank">
              <BankTag bank={bankByBin[member.bankBin]} bin={member.bankBin} /> · <span className="mono">{member.accountNo}</span>
            </span>
          )}
        </div>

        {member && (
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={section === 'profile'} className={section === 'profile' ? 'active' : ''}
              onClick={() => setSection('profile')}>Thông tin của tôi</button>
            <button type="button" role="tab" aria-selected={section === 'password'} className={section === 'password' ? 'active' : ''}
              onClick={() => setSection('password')}>Đổi mật khẩu</button>
          </div>
        )}

        {section === 'profile'
          ? <ProfileForm member={member} banks={banks} onUpdated={onUpdated} />
          : <PasswordForm />}

        <button className="btn danger" onClick={onLogout}>Đăng xuất</button>
      </div>
    </Sheet>
  )
}

function ProfileForm({ member, banks, onUpdated }) {
  const [form, setForm] = useState({ fullName: member.fullName, bankBin: member.bankBin, accountNo: member.accountNo })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const unchanged = form.fullName === member.fullName && form.bankBin === member.bankBin && form.accountNo === member.accountNo

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      onUpdated(await api('/api/auth/me', { method: 'PUT', body: JSON.stringify(form) }))
      toast.success('Đã cập nhật thông tin')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card bordered" onSubmit={submit}>
      <label>Họ tên
        <input required autoComplete="name" value={form.fullName} onChange={set('fullName')} />
      </label>
      {/* div thay vì label: label sẽ chuyển click trong menu sang nút trigger */}
      <div className="field">Ngân hàng
        <BankSelect required banks={banks} value={form.bankBin} onChange={(bankBin) => setForm({ ...form, bankBin })} />
      </div>
      <label>Số tài khoản
        <input required inputMode="numeric" pattern="\d{4,30}" value={form.accountNo} onChange={set('accountNo')} />
      </label>
      <p className="hint">Hoá đơn đã lưu giữ thông tin cũ; hoá đơn mới sẽ dùng thông tin này.</p>
      <button className="btn primary" disabled={saving || unchanged}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
    </form>
  )
}

function PasswordForm() {
  const [pw, setPw] = useState(emptyPw)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setPw({ ...pw, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) {
      toast.error('Mật khẩu mới nhập lại không khớp')
      return
    }
    setSaving(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }),
      })
      setPw(emptyPw)
      toast.success('Đã đổi mật khẩu')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card bordered" onSubmit={submit}>
      <label>Mật khẩu hiện tại
        <input required type="password" autoComplete="current-password" value={pw.currentPassword} onChange={set('currentPassword')} />
      </label>
      <label>Mật khẩu mới
        <input required type="password" minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={set('newPassword')} />
      </label>
      <label>Nhập lại mật khẩu mới
        <input required type="password" minLength={6} autoComplete="new-password" value={pw.confirm} onChange={set('confirm')} />
      </label>
      <button className="btn primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
    </form>
  )
}
