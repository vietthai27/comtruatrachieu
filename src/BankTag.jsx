/** Logo + tên ngắn của ngân hàng; chưa tải xong danh sách thì hiện BIN. */
export default function BankTag({ bank, bin }) {
  return bank ? <span className="bank-cell"><img src={bank.logo} alt="" />{bank.shortName}</span> : bin
}
