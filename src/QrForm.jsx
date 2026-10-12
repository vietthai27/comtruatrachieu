import { useEffect, useState } from 'react'

const initial = {
  accountNo: '',
  accountName: '',
  acqId: '',
  addInfo: '',
  amount: '',
  template: '7GSTatT',
}

export default function QrForm() {
  const [form, setForm] = useState(initial)
  const [banks, setBanks] = useState([])
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/banks')
      .then((r) => r.json())
      .then((j) => setBanks(j.data ?? []))
      .catch(() => {})
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setQr(null)
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.code !== '00') throw new Error(json.desc || json.message || `HTTP ${res.status}`)
      setQr(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="qr-layout">
      <form onSubmit={submit}>
        <label>Số tài khoản
          <input required value={form.accountNo} onChange={set('accountNo')} />
        </label>
        <label>Tên chủ tài khoản
          <input required value={form.accountName} onChange={set('accountName')} />
        </label>
        <label>Ngân hàng
          <select required value={form.acqId} onChange={set('acqId')}>
            <option value="">-- Chọn ngân hàng --</option>
            {banks.map((b) => (
              <option key={b.id} value={b.bin}>{b.shortName} - {b.name}</option>
            ))}
          </select>
        </label>
        <label>Số tiền
          <input type="number" min="0" value={form.amount} onChange={set('amount')} />
        </label>
        <label>Nội dung
          <input value={form.addInfo} onChange={set('addInfo')} />
        </label>
        <label>Template
          <input value={form.template} onChange={set('template')} />
        </label>
        <button disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo QR'}</button>
        {error && <p className="error">Lỗi: {error}</p>}
      </form>

      <div className="qr-result">
        {qr && (
          <>
            <img src={qr.qrDataURL} alt="VietQR" />
            <a href={qr.qrDataURL} download="vietqr.png">Tải ảnh</a>
          </>
        )}
      </div>
    </div>
  )
}
