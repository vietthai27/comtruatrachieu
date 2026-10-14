const TEMPLATE = '7GSTatT'

// VietQR yêu cầu tên chủ TK / nội dung viết hoa, không dấu
export const unaccent = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

export const money = (n) => n.toLocaleString('vi-VN') + ' đ'

// Làm tròn lên 1.000đ cho dễ chuyển khoản (BE dùng cùng công thức khi lưu hoá đơn)
export const roundUp = (n) => Math.ceil(n / 1000) * 1000

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })

/** Tạo QR VietQR chuyển cho người nhận; trả về data URL của ảnh. */
export async function generateQr({ fullName, bankBin, accountNo }, amount, note) {
  const json = await api('/api/qr', {
    method: 'POST',
    body: JSON.stringify({
      accountNo,
      accountName: unaccent(fullName).toUpperCase(),
      acqId: bankBin,
      amount,
      addInfo: unaccent(note ?? '').slice(0, 25),
      template: TEMPLATE,
    }),
  })
  if (json.code !== '00') throw new Error(json.desc || json.message || 'VietQR lỗi')
  return json.data.qrDataURL
}

// ---- đăng nhập: token JWT lưu trong localStorage ----
const TOKEN_KEY = 'auth_token'
export const LOGOUT_EVENT = 'auth:logout'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* trình duyệt chặn storage: chỉ giữ phiên trong bộ nhớ */ }
}

/** fetch JSON kèm token, ném lỗi với message từ BE ({"message": ...}) nếu không OK. 401 = tự đăng xuất. */
export async function api(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  const json = await res.json().catch(() => ({}))
  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
  return json
}
