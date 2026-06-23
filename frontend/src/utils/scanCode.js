/**
 * GS1 QR / DataMatrix: 010 + 14 xonali GTIN + qo'shimcha ma'lumot.
 * Masalan: 01047800690007342175B-45L_W=zl933Z4k → 4780069000734
 */

export function normalizeBarcode(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (/^\d{14}$/.test(s) && s.startsWith('0')) {
    const trimmed = s.replace(/^0+/, '');
    return trimmed || s;
  }
  return s;
}

/** Skaner yoki qo'lda kiritilgan kodni mahsulot shtrix-kodiga aylantiradi. */
export function parseScanCode(raw) {
  const code = String(raw || '').trim();
  if (!code) return '';

  // GS1 DataMatrix: AI "01" + 14 xonali GTIN + boshqa AI lar (17, 21, ...)
  // 01047800690007342175B-... → GTIN 04780069000734 → 4780069000734
  if (code.startsWith('01') && code.length >= 16) {
    const gtin14 = code.slice(2, 16);
    if (/^\d{14}$/.test(gtin14)) {
      return normalizeBarcode(gtin14);
    }
  }

  return normalizeBarcode(code);
}

/** Ikki shtrix-kod mos keladimi (13/14 xona, boshidagi 0). */
export function barcodesMatch(stored, scanned) {
  const a = normalizeBarcode(stored);
  const b = normalizeBarcode(scanned);
  if (!a || !b) return false;
  if (a === b) return true;
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    return a.padStart(14, '0') === b.padStart(14, '0');
  }
  return false;
}

/** Mahsulot ro'yxatidan skaner kodiga mosini topadi. */
export function findProductByScanCode(products, rawCode) {
  const parsed = parseScanCode(rawCode);
  if (!parsed) return null;

  return products.find((p) => barcodesMatch(p.barcode, parsed)) || null;
}
