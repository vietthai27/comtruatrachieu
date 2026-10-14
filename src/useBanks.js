import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

/** Danh sách ngân hàng VietQR + map tra theo BIN. */
export default function useBanks() {
  const [banks, setBanks] = useState([])

  useEffect(() => {
    fetch('/api/banks')
      .then((r) => r.json())
      .then((j) => setBanks(j.data ?? []))
      .catch(() => toast.error('Không tải được danh sách ngân hàng'))
  }, [])

  const bankByBin = useMemo(() => Object.fromEntries(banks.map((b) => [b.bin, b])), [banks])
  return { banks, bankByBin }
}
