"""58mm termo printer — ESC/POS (PostScript emas)."""

from __future__ import annotations

import glob
import os
import subprocess
import time

ESC = b'\x1b'
GS = b'\x1d'
WIDTH = 32


def _fmt_num(value) -> str:
    try:
        n = int(round(float(value)))
    except (TypeError, ValueError):
        return '0'
    return f'{n:,}'.replace(',', ' ')


def _enc(text: str) -> bytes:
    return str(text or '').encode('utf-8', errors='replace')


def _init() -> bytes:
    return ESC + b'@'


def _align(mode: int) -> bytes:
    return ESC + b'a' + bytes([mode])


def _bold(on: bool = True) -> bytes:
    return ESC + b'E' + (b'\x01' if on else b'\x00')


def _line(text: str = '') -> bytes:
    return _enc(text) + b'\n'


def _feed(lines: int = 3) -> bytes:
    return ESC + b'd' + bytes([max(0, min(lines, 255))])


def _cut() -> bytes:
    return GS + b'V' + b'\x00'


def _separator() -> bytes:
    return _line('-' * WIDTH)


def _row(left: str, right: str) -> bytes:
    left = str(left)
    right = str(right)
    if len(left) + len(right) + 1 > WIDTH:
        half = WIDTH // 2
        return _line(left[:half]) + _row('', right)
    gap = WIDTH - len(left) - len(right)
    return _line(left + (' ' * gap) + right)


def format_receipt_escpos(receipt: dict) -> bytes:
    buf = bytearray()
    buf += _init()
    buf += _align(1)
    buf += _bold(True)
    buf += _line(receipt.get('storeName') or 'SmartPOS')
    buf += _bold(False)
    buf += _line('Kassa / POS tizimi')
    buf += _line(f"{receipt.get('date', '')}  {receipt.get('time', '')}")
    buf += _line(f"CHEK № {receipt.get('id', '')}")
    buf += _align(0)
    buf += _separator()
    buf += _align(1)
    buf += _line('SAVDO CHEKI')
    buf += _align(0)

    for item in receipt.get('items') or []:
        name = str(item.get('name') or '')[:WIDTH]
        buf += _bold(True)
        buf += _line(name)
        buf += _bold(False)
        qty = item.get('qty') or 0
        price = item.get('price') or 0
        total = float(qty) * float(price)
        buf += _row(f"{qty} x {_fmt_num(price)}", _fmt_num(total))

    buf += _separator()
    buf += _row('Mahsulot turlari:', str(len(receipt.get('items') or [])))
    buf += _row('Jami dona:', f"{receipt.get('itemCount', 0)} ta")
    buf += _row("To'lov:", str(receipt.get('method') or ''))

    breakdown = receipt.get('paymentBreakdown') or {}
    for key, value in breakdown.items():
        buf += _row(f'{key}:', f"{_fmt_num(value)} so'm")

    if receipt.get('method') == 'Nasiya' and receipt.get('customerName'):
        buf += _row('Mijoz:', str(receipt.get('customerName')))

    buf += _row('Kassir:', str(receipt.get('cashier') or ''))
    buf += _separator()
    buf += _align(2)
    buf += _line("JAMI TO'LOV")
    buf += _bold(True)
    buf += _line(f"{_fmt_num(receipt.get('amount', 0))} so'm")
    buf += _bold(False)
    buf += _align(1)
    buf += _line('')
    buf += _line('Xaridingiz uchun rahmat!')
    buf += _feed(4)
    buf += _cut()
    return bytes(buf)


def get_printer_name() -> str:
    return os.environ.get('THERMAL_PRINTER_NAME', 'Unknown').strip() or 'Unknown'


def discover_usb_lp_device() -> str | None:
    configured = os.environ.get('THERMAL_PRINTER_DEVICE', '').strip()
    if configured and os.path.exists(configured):
        return configured
    devices = sorted(glob.glob('/dev/usb/lp*'))
    return devices[-1] if devices else None


def _write_direct(device_path: str, data: bytes) -> None:
    with open(device_path, 'wb') as device:
        device.write(data)
        device.flush()
        try:
            os.fsync(device.fileno())
        except OSError:
            # Ba'zi USB termo printerlar fsync qo'llab-quvvatlamaydi.
            pass


def _print_via_cups(name: str, data: bytes) -> None:
    proc = subprocess.run(
        ['lp', '-d', name, '-o', 'raw'],
        input=data,
        capture_output=True,
        timeout=20,
        check=False,
    )
    if proc.returncode != 0:
        err = proc.stderr.decode('utf-8', errors='replace').strip()
        out = proc.stdout.decode('utf-8', errors='replace').strip()
        raise RuntimeError(err or out or 'CUPS printerga yuborib bo\'lmadi')

    time.sleep(0.8)
    stuck = subprocess.run(
        ['lpstat', '-o'],
        capture_output=True,
        text=True,
        timeout=5,
        check=False,
    )
    output = stuck.stdout or ''
    if 'Waiting for printer to become available' in output or 'Ожидание доступа' in output:
        raise RuntimeError(
            'Printer navbatda qoldi (CUPS USB ga ulana olmadi). '
            'Printer tokda va qog\'oz borligini tekshiring.'
        )


def print_receipt(receipt: dict, printer_name: str | None = None) -> dict:
    """ESC/POS chekni chop etadi. Avval USB device, keyin CUPS."""
    data = format_receipt_escpos(receipt)
    device = discover_usb_lp_device()
    if device:
        try:
            _write_direct(device, data)
            return {'method': 'usb', 'target': device}
        except OSError as exc:
            if os.environ.get('THERMAL_PRINTER_ALLOW_CUPS_FALLBACK', '0') != '1':
                raise RuntimeError(
                    f'USB printerga yozib bo\'lmadi ({device}): {exc}. '
                    'Printer yoqilgan va qog\'oz borligini tekshiring.'
                ) from exc

    name = (printer_name or get_printer_name()).strip()
    _print_via_cups(name, data)
    return {'method': 'cups', 'target': name}
