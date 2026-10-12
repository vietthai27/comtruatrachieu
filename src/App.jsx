import { useEffect, useMemo, useState } from 'react'
import QrForm from './QrForm.jsx'

function BankList() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/banks')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => setBanks(json.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return banks
    return banks.filter((b) =>
      [b.name, b.shortName, b.code, b.bin].some((v) => String(v ?? '').toLowerCase().includes(q)),
    )
  }, [banks, query])

  return (
    <>
      <h1>Danh sách ngân hàng</h1>
      <input
        type="search"
        placeholder="Tìm theo tên, mã, BIN..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p>Đang tải...</p>}
      {error && <p className="error">Lỗi: {error}</p>}
      {!loading && !error && (
        <>
          <p className="count">{filtered.length} ngân hàng</p>
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Tên</th>
                <th>Tên ngắn</th>
                <th>Mã</th>
                <th>BIN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><img src={b.logo} alt={b.shortName} height="32" /></td>
                  <td>{b.name}</td>
                  <td>{b.shortName}</td>
                  <td>{b.code}</td>
                  <td>{b.bin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

export default function App() {
  const [tab, setTab] = useState('qr')
  return (
    <main>
      <nav>
        <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}>Tạo QR</button>
        <button className={tab === 'banks' ? 'active' : ''} onClick={() => setTab('banks')}>Danh sách ngân hàng</button>
      </nav>
      {tab === 'qr' ? <><h1>Tạo VietQR</h1><QrForm /></> : <BankList />}
    </main>
  )
}
