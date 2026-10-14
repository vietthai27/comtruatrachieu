// Số cặp màu avatar (định nghĩa .avatar-c0..c7 trong index.css, có bản sáng và tối)
const COLOR_COUNT = 8

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)

/** Chữ cái đầu của 2 từ cuối trong họ tên: "Trần Văn A" -> "VA", "Hậu" -> "H". */
const initials = (name) =>
  name.trim().split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?'

export default function Avatar({ name, size = 40 }) {
  const text = initials(name)
  // mỗi người luôn ra cùng một màu theo tên
  const color = Math.abs(hash(name)) % COLOR_COUNT
  return (
    <span className={`avatar avatar-c${color}`}
      style={{ width: size, height: size, fontSize: size * (text.length > 1 ? 0.36 : 0.42) }}
      aria-hidden="true">
      {text}
    </span>
  )
}
