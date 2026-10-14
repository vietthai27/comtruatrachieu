import { useEffect, useState } from 'react'

const KEY = 'theme' // 'light' | 'dark'; không có = theo hệ thống
const media = window.matchMedia('(prefers-color-scheme: dark)')

const systemTheme = () => (media.matches ? 'dark' : 'light')

const storedTheme = () => {
  try { return localStorage.getItem(KEY) } catch { return null }
}

const apply = (theme) => {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#121316' : '#f2f3f7')
}

/** Theme hiện tại + hàm đổi sáng/tối. Mặc định theo hệ thống; đổi về đúng chế độ hệ thống thì lại theo hệ thống. */
export default function useTheme() {
  const [theme, setTheme] = useState(() => storedTheme() ?? systemTheme())

  useEffect(() => { apply(theme) }, [theme])

  // Chưa chọn tay thì đi theo hệ thống khi hệ thống đổi
  useEffect(() => {
    const onChange = () => { if (!storedTheme()) setTheme(systemTheme()) }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    try {
      if (next === systemTheme()) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch { /* storage bị chặn: chỉ đổi trong phiên này */ }
    setTheme(next)
  }

  return [theme, toggle]
}
