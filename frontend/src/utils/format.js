export function formatCurrency(n) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

export function formatMillions(n) {
  return (n / 1_000_000).toFixed(1) + 'M';
}

/** 16/06/2026 */
export function formatDateShort(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}
