import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import Sheet from './Sheet.jsx'
import Avatar from './Avatar.jsx'
import { api, unaccent } from './lib.js'

const normalize = (s) => unaccent(s).toLowerCase()

/** Danh sách nhóm của mình; tạo / sửa thành viên / xoá nhóm. */
export default function Groups({ me }) {
  const [groups, setGroups] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  // null = đóng sheet, 'new' = tạo mới, số = id nhóm đang sửa
  const [editing, setEditing] = useState(null)

  const load = () =>
    api('/api/groups')
      .then(setGroups)
      .catch((e) => toast.error(`Không tải được nhóm: ${e.message}`))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    api('/api/members').then(setMembers).catch((e) => toast.error(`Không tải được thành viên: ${e.message}`))
  }, [])

  const current = typeof editing === 'number' ? groups.find((g) => g.id === editing) : null

  return (
    <>
      {loading ? <p className="muted">Đang tải...</p> : (
        <>
          <p className="muted">{groups.length} nhóm</p>
          <ul className="list">
            {groups.map((g) => (
              <li key={g.id}>
                <button className="list-item" onClick={() => setEditing(g.id)}>
                  <span className="avatar-stack">
                    {g.members.slice(0, 3).map((m) => <Avatar key={m.id} name={m.fullName} size={32} />)}
                  </span>
                  <span className="list-main">
                    <b>{g.name}</b>
                    <small>{g.members.length} thành viên · {g.members.map((m) => m.fullName).join(', ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {groups.length === 0 && <p className="empty-state">Bạn chưa ở nhóm nào.<br />Bấm + để tạo nhóm.</p>}
        </>
      )}

      <button className="fab" onClick={() => setEditing('new')} aria-label="Tạo nhóm">+</button>

      {editing && (
        <GroupForm key={editing} group={current} members={members} me={me}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load() }} />
      )}
    </>
  )
}

function GroupForm({ group, members, me, onClose, onSaved }) {
  const [name, setName] = useState(group?.name ?? '')
  // nhóm mới: mặc định có mình
  const [selected, setSelected] = useState(() => new Set(group ? group.members.map((m) => m.id) : [me.id]))
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return q ? members.filter((m) => normalize(m.fullName).includes(q)) : members
  }, [members, query])

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api(group ? `/api/groups/${group.id}` : '/api/groups', {
        method: group ? 'PUT' : 'POST',
        body: JSON.stringify({ name, memberIds: [...selected] }),
      })
      toast.success(group ? 'Đã lưu nhóm' : 'Đã tạo nhóm')
      await onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Xoá nhóm "${group.name}"? Hoá đơn cũ vẫn giữ nguyên.`)) return
    try {
      await api(`/api/groups/${group.id}`, { method: 'DELETE' })
      toast.success('Đã xoá nhóm')
      await onSaved()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const leavingSelf = group && !selected.has(me.id)

  return (
    <Sheet title={group ? 'Sửa nhóm' : 'Tạo nhóm'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>Tên nhóm
          <input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Team văn phòng" />
        </label>

        <div className="card flush bordered">
          <div className="card-head"><span>Thành viên <b>{selected.size}</b></span></div>
          <input type="search" className="group-search" placeholder="Tìm thành viên..." value={query}
            onChange={(e) => setQuery(e.target.value)} />
          <ul className="list checks group-members">
            {filtered.map((m) => (
              <li key={m.id}>
                <label className={`list-item ${selected.has(m.id) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
                  <Avatar name={m.fullName} size={32} />
                  <span className="list-main">
                    <b>{m.fullName}{m.id === me.id && <span className="you"> (bạn)</span>}</b>
                  </span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && <li className="empty-state">Không tìm thấy</li>}
          </ul>
        </div>

        {leavingSelf && <p className="hint">Bạn đang bỏ chính mình khỏi nhóm — lưu xong bạn sẽ không còn thấy nhóm này.</p>}

        <button className="btn primary" disabled={saving || selected.size === 0}>
          {saving ? 'Đang lưu...' : group ? 'Lưu' : 'Tạo nhóm'}
        </button>
        {group && <button type="button" className="btn danger" onClick={remove}>Xoá nhóm</button>}
      </form>
    </Sheet>
  )
}
