import { apiRequest } from '../api/client';

/** Termo printerga ESC/POS chek yuborish (server orqali, PostScript emas). */
export async function printThermalReceipt(receipt) {
  if (!receipt) return { ok: false, error: 'Chek yo\'q' };

  try {
    const res = await apiRequest('/api/v1/pos/print-receipt', {
      method: 'POST',
      body: JSON.stringify(receipt),
    });
    return { ok: true, printer: res?.printer };
  } catch (err) {
    return { ok: false, error: err.message || 'Printerga yuborib bo\'lmadi' };
  }
}
