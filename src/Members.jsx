import { useEffect, useMemo, useState } from 'react'
import BankSelect from './BankSelect.jsx'
import Sheet from './Sheet.jsx'
import Avatar from './Avatar.jsx'
import { toast } from 'react-toastify'
import { api } from './lib.js'

const empty = { fullName: '', bankBin: '', accountNo: '' }

export default function Members({ me }) {
  const [members, setMembers] = useState([])
  const [banks, setBanks] = useState([])
  const [form, setForm] = useState(empty)
  // null = đóng sheet, 'new' = thêm mới, số = id đang sửa
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const bankByBin = useMemo(() => Object.fromEntries(banks.map((b) => [b.bin, b])), [banks])

  const load = () =>
    api('/api/members')
      .then(setMembers)
      .catch((e) => toast.error(`Không tải được thành viên: ${e.message}`))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    api('/api/banks')
      .then((j) => setBanks(j.data ?? []))
      .catch(() => toast.error('Không tải được danh sách ngân hàng'))
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const open = (m) => {
    setEditing(m ? m.id : 'new')
    setForm(m ? { fullName: m.fullName, bankBin: m.bankBin, accountNo: m.accountNo } : empty)
  }

  const close = () => setEditing(null)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isNew = editing === 'new'
      await api(isNew ? '/api/members' : `/api/members/${editing}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      })
      close()
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Xoá thành viên "${form.fullName}"?\n\nThành viên sẽ bị gỡ khỏi các nhóm và tài khoản đăng nhập (nếu có) bị xoá. Lịch sử hoá đơn vẫn giữ nguyên.`)) return
    try {
      await api(`/api/members/${editing}`, { method: 'DELETE' })
      close()
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      {loading ? <p className="muted">Đang tải...</p> : (
        <>
          <p className="muted">{members.length} thành viên</p>
          <ul className="list">
            {members.map((m) => {
              const bank = bankByBin[m.bankBin]
              return (
                <li key={m.id}>
                  <button className="list-item" onClick={() => open(m)}>
                    <Avatar name={m.fullName} />
                    <span className="list-main">
                      <b>{m.fullName}{me?.id === m.id && <span className="you"> (bạn)</span>}</b>
                      <small className="mono">{m.accountNo}</small>
                    </span>
                    {bank ? <img className="logo" src={bank.logo} alt={bank.shortName} /> : <small>{m.bankBin}</small>}
                  </button>
                </li>
              )
            })}
          </ul>
          {members.length === 0 && <p className="empty-state">Chưa có thành viên nào.<br />Bấm + để thêm.</p>}
        </>
      )}

      <button className="fab" onClick={() => open(null)} aria-label="Thêm thành viên">+</button>

      {editing && (
        <Sheet title={editing === 'new' ? 'Thêm thành viên' : 'Sửa thành viên'} onClose={close}>
          <form className="stack" onSubmit={submit}>
            <label>Họ tên
              <input required value={form.fullName} onChange={set('fullName')} autoComplete="off" />
            </label>
            {/* div thay vì label: label sẽ chuyển click trong menu sang nút trigger */}
            <div className="field">Ngân hàng
              <BankSelect required banks={banks} value={form.bankBin}
                onChange={(bankBin) => setForm({ ...form, bankBin })} />
            </div>
            <label>Số tài khoản
              <input required inputMode="numeric" pattern="\d{4,30}" value={form.accountNo} onChange={set('accountNo')} />
            </label>
            <button className="btn primary" disabled={saving}>
              {saving ? 'Đang lưu...' : editing === 'new' ? 'Thêm' : 'Lưu'}
            </button>
            {editing !== 'new' && <button type="button" className="btn danger" onClick={remove}>Xoá thành viên</button>}
          </form>
        </Sheet>
      )}
    </>
  )
}
