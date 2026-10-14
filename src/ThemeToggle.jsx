/** Công tắc bật/tắt giao diện tối; theme hiện tại lấy từ useTheme() ở App. */
export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Giao diện tối"
      title={dark ? 'Tắt giao diện tối' : 'Bật giao diện tối'}
      className={`theme-switch ${dark ? 'on' : ''}`} onClick={onToggle}>
      <span className="theme-switch-knob" aria-hidden="true">{dark ? '🌙' : '☀️'}</span>
    </button>
  )
}
