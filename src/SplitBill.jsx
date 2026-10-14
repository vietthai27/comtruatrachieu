import { useEffect, useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import Avatar from './Avatar.jsx'
import BankTag from './BankTag.jsx'
import useBanks from './useBanks.js'
import { toast } from 'react-toastify'
import { api, generateQr, money, roundUp, unaccent } from './lib.js'

const GROUP_KEY = 'split_group'
const loadGroupKey = () => {
  try { return localStorage.getItem(GROUP_KEY) ?? 'all' } catch { return 'all' }
}

export default function SplitBill({ me }) {
  const [allMembers, setAllMembers] = useState([])
  const [groups, setGroups] = useState([])
  // 'all' = tất cả thành viên, còn lại là id nhóm (chuỗi); nhớ lựa chọn lần trước
  const [groupKey, setGroupKey] = useState(loadGroupKey)
  const [total, setTotal] = useState('')
  const [note, setNote] = useState('Com trua')
  const [joined, setJoined] = useState(new Set())
  const [payerId, setPayerId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { bankByBin } = useBanks()

  useEffect(() => {
    api('/api/members')
      .then(setAllMembers)
      .catch((e) => toast.error(`Không tải được thành viên: ${e.message}`))
    api('/api/groups')
      .then(setGroups)
      .catch((e) => toast.error(`Không tải được nhóm: ${e.message}`))
  }, [])

  const group = groups.find((g) => String(g.id) === groupKey) ?? null
  // nhóm đã nhớ nhưng không còn (bị xoá / bị rời) thì quay về "Tất cả"
  useEffect(() => {
    if (groups.length && groupKey !== 'all' && !group) setGroupKey('all')
  }, [groups])

  const members = useMemo(() => {
    if (!group) return allMembers
    const ids = new Set(group.members.map((m) => m.id))
    return allMembers.filter((m) => ids.has(m.id))
  }, [allMembers, group])

  // Đổi nhóm (hoặc tải xong danh sách): chỉ mặc định chọn mình nếu mình có trong danh sách
  useEffect(() => {
    try { localStorage.setItem(GROUP_KEY, groupKey) } catch { /* bỏ qua */ }
    setJoined(me && members.some((m) => m.id === me.id) ? new Set([me.id]) : new Set())
  }, [members])

  const participants = members.filter((m) => joined.has(m.id))
  const payer = members.find((m) => String(m.id) === payerId)
  const amount = Number(total) || 0

  // Mọi thay đổi đầu vào làm kết quả cũ không còn đúng
  useEffect(() => { setResult(null) }, [total, note, joined, payerId])

  useEffect(() => {
    if (payer && !joined.has(payer.id)) setPayerId('')
  }, [joined])

  const toggle = (id) => {
    const next = new Set(joined)
    next.has(id) ? next.delete(id) : next.add(id)
    setJoined(next)
  }

  const toggleAll = () =>
    setJoined(joined.size === members.length ? new Set() : new Set(members.map((m) => m.id)))

  const canSplit = amount > 0 && participants.length >= 2 && payer

  const split = async () => {
    setLoading(true)
    setResult(null)
    const share = roundUp(amount / participants.length)
    const debtors = participants.filter((m) => m.id !== payer.id)
    try {
      const qr = await generateQr(payer, share, note)
      setResult({ share, debtors, qr, savedId: null })
    } catch (err) {
      toast.error(`Không tạo được QR: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const bill = await api('/api/bills', {
        method: 'POST',
        body: JSON.stringify({
          totalAmount: amount,
          note,
          payerId: payer.id,
          participantIds: participants.map((m) => m.id),
          groupId: group?.id ?? null,
        }),
      })
      setResult((r) => ({ ...r, savedId: bill.id }))
      toast.success('Đã lưu hoá đơn — xem ở tab Hoá đơn')
    } catch (err) {
      toast.error(`Không lưu được hoá đơn: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const shareQr = async () => {
    const blob = await (await fetch(result.qr)).blob()
    const file = new File([blob], 'qr.png', { type: 'image/png' })
    const text = `${note}: mỗi người ${money(result.share)} → ${payer.fullName}`
    if (navigator.canShare?.({ files: [file] })) navigator.share({ files: [file], text }).catch(() => {})
  }

  return (
    <div className="stack with-sticky">
      <section className="card">
        <label>Tổng tiền
          <span className="amount-input">
            <input inputMode="numeric" placeholder="0" value={amount ? amount.toLocaleString('vi-VN') : ''}
              onChange={(e) => setTotal(e.target.value.replace(/\D/g, ''))} />
            <span>đ</span>
          </span>
        </label>
        <label>Nội dung chuyển khoản
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </section>

      <section className="card flush">
        <div className="group-chips" role="tablist" aria-label="Nhóm">
          {[{ key: 'all', name: 'Tất cả' }, ...groups.map((g) => ({ key: String(g.id), name: g.name }))].map((g) => (
            <button key={g.key} type="button" role="tab" aria-selected={groupKey === g.key}
              className={`group-chip ${groupKey === g.key ? 'active' : ''}`} onClick={() => setGroupKey(g.key)}>
              {g.name}
            </button>
          ))}
        </div>
        <div className="card-head">
          <span>Thành viên tham gia <b>{participants.length}/{members.length}</b></span>
          {members.length > 0 && (
            <button type="button" className="link" onClick={toggleAll}>
              {joined.size === members.length ? 'Bỏ chọn' : 'Chọn tất cả'}
            </button>
          )}
        </div>
        <ul className="list checks">
          {members.map((m) => (
            <li key={m.id}>
              <label className={`list-item ${joined.has(m.id) ? 'checked' : ''}`}>
                <input type="checkbox" checked={joined.has(m.id)} onChange={() => toggle(m.id)} />
                <Avatar name={m.fullName} size={36} />
                <span className="list-main">
                  <b>{m.fullName}{me?.id === m.id && <span className="you"> (bạn)</span>}</b>
                  {payer?.id === m.id && <small className="badge">Người trả</small>}
                </span>
                {bankByBin[m.bankBin] && <img className="logo" src={bankByBin[m.bankBin].logo} alt="" />}
              </label>
            </li>
          ))}
        </ul>
        {members.length === 0 && <p className="empty-state">Chưa có thành viên — thêm ở tab Thành viên</p>}
      </section>

      <section className="card">
        <div className="field">
          <span>Người trả {payer && <b className="payer-name">· {payer.fullName}</b>}</span>
          {participants.length === 0 ? (
            <p className="hint">Chọn thành viên tham gia trước</p>
          ) : (
            <div className="payer-picker" role="radiogroup" aria-label="Người trả">
              {participants.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={payer?.id === m.id}
                  className={`payer-option ${payer?.id === m.id ? 'selected' : ''}`}
                  onClick={() => setPayerId(String(m.id))}>
                  <span className="payer-avatar">
                    <Avatar name={m.fullName} size={52} />
                    {payer?.id === m.id && <span className="payer-check">✓</span>}
                  </span>
                  <span className="payer-label">{m.fullName.trim().split(/\s+/).pop()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>


      <div className="sticky-action">
        {amount > 0 && participants.length > 0 && (
          <p className="summary">
            {money(amount)} / {participants.length} người = <b>{money(roundUp(amount / participants.length))}</b>/người
          </p>
        )}
        <button className="btn primary" disabled={!canSplit || loading} onClick={split}>
          {loading ? 'Đang tạo QR...' : 'Chia tiền đều'}
        </button>
      </div>

      {result && (
        <Sheet title="QR chuyển khoản" onClose={() => setResult(null)}>
          <div className="qr-sheet">
            <img className="qr" src={result.qr} alt={`QR ${payer.fullName}`} />
            <p className="qr-amount">{money(result.share)}<small>/người</small></p>
            <p className="muted payee">
              <BankTag bank={bankByBin[payer.bankBin]} bin={payer.bankBin} /> · {payer.fullName} · <span className="mono">{payer.accountNo}</span>
            </p>
            <div className="debtors">
              <small className="muted">Cần chuyển ({result.debtors.length} người)</small>
              <div className="chips">
                {result.debtors.map((m) => (
                  <span key={m.id} className="chip"><Avatar name={m.fullName} size={22} />{m.fullName}</span>
                ))}
              </div>
            </div>
            <div className="row">
              <a className="btn" href={result.qr} download={`qr-${unaccent(payer.fullName).replace(/\s+/g, '-')}.png`}>Tải ảnh</a>
              {'share' in navigator && <button className="btn" onClick={shareQr}>Chia sẻ</button>}
            </div>
            <button className="btn primary" disabled={saving || !!result.savedId} onClick={save}>
              {result.savedId ? 'Đã lưu hoá đơn ✓' : saving ? 'Đang lưu...' : 'Lưu hoá đơn'}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
