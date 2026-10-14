import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Sheet from './Sheet.jsx'
import Avatar from './Avatar.jsx'
import BankTag from './BankTag.jsx'
import useBanks from './useBanks.js'
import { api, formatDateTime, generateQr, money } from './lib.js'

export default function Bills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const { bankByBin } = useBanks()

  useEffect(() => {
    api('/api/bills')
      .then(setBills)
      .catch((e) => toast.error(`Không tải được hoá đơn: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Đang tải...</p>

  return (
    <>
      <p className="muted">{bills.length} hoá đơn</p>
      {bills.length === 0 ? (
        <p className="empty-state">Chưa có hoá đơn nào.<br />Chia tiền xong bấm “Lưu hoá đơn” để lưu lại.</p>
      ) : (
        <ul className="list">
          {bills.map((b) => (
            <li key={b.id}>
              <button className="list-item" onClick={() => setSelected(b)}>
                <Avatar name={b.payerName} />
                <span className="list-main">
                  <b>{b.note || 'Hoá đơn'} · {money(b.totalAmount)}</b>
                  <small>
                    {b.groupName && <span className="group-tag">{b.groupName}</span>}
                    {b.payerName} trả · {b.participants.length} người · {formatDateTime(b.createdAt)}
                  </small>
                </span>
                <span className="bill-share">{money(b.shareAmount)}<small>/người</small></span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && <BillDetail bill={selected} bank={bankByBin[selected.payerBankBin]} onClose={() => setSelected(null)} />}
    </>
  )
}

function BillDetail({ bill, bank, onClose }) {
  const [qr, setQr] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const payer = { fullName: bill.payerName, bankBin: bill.payerBankBin, accountNo: bill.payerAccountNo }

  const showQr = async () => {
    setLoadingQr(true)
    try {
      setQr(await generateQr(payer, bill.shareAmount, bill.note))
    } catch (err) {
      toast.error(`Không tạo được QR: ${err.message}`)
    } finally {
      setLoadingQr(false)
    }
  }

  return (
    <Sheet title={`Hoá đơn #${bill.id}`} onClose={onClose}>
      <div className="stack">
        <div className="bill-summary">
          {bill.groupName && <span className="group-tag">{bill.groupName}</span>}
          <span className="muted">{formatDateTime(bill.createdAt)}{bill.note && ` · ${bill.note}`}</span>
          <span className="qr-amount">{money(bill.totalAmount)}</span>
          <span className="muted">{bill.participants.length} người · mỗi người <b>{money(bill.shareAmount)}</b></span>
        </div>

        <div className="card bordered">
          <small className="muted">Người trả</small>
          <div className="bill-payer">
            <Avatar name={bill.payerName} />
            <span className="list-main">
              <b>{bill.payerName}</b>
              <small className="mono">{bill.payerAccountNo}</small>
            </span>
            <BankTag bank={bank} bin={bill.payerBankBin} />
          </div>
        </div>

        <div className="card flush bordered">
          <div className="card-head"><span>Thành viên tham gia <b>{bill.participants.length}</b></span></div>
          <ul className="list">
            {bill.participants.map((p) => {
              const isPayer = p.memberId === bill.payerMemberId
              return (
                <li key={`${p.memberId}-${p.fullName}`} className="list-item">
                  <Avatar name={p.fullName} size={36} />
                  <span className="list-main"><b>{p.fullName}</b></span>
                  {isPayer ? <small className="badge">Người trả</small> : <span className="mono">{money(bill.shareAmount)}</span>}
                </li>
              )
            })}
          </ul>
        </div>

        {qr ? (
          <div className="qr-sheet">
            <img className="qr" src={qr} alt={`QR ${bill.payerName}`} />
            <a className="btn" href={qr} download={`hoa-don-${bill.id}.png`}>Tải ảnh QR</a>
          </div>
        ) : (
          <button className="btn primary" disabled={loadingQr} onClick={showQr}>
            {loadingQr ? 'Đang tạo QR...' : 'Hiện QR chuyển khoản'}
          </button>
        )}
      </div>
    </Sheet>
  )
}
