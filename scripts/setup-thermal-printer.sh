#!/bin/bash
# Xprinter XP-58 — USB orqali to'g'ridan-to'g'ri (CUPS navbat muammosiz)
set -euo pipefail

PRINTER_NAME="${1:-Termo}"
DEVICE="${2:-}"

if [[ -z "$DEVICE" ]]; then
  DEVICE="$(ls /dev/usb/lp* 2>/dev/null | tail -1 || true)"
fi

if [[ -z "$DEVICE" ]]; then
  echo "XATO: /dev/usb/lp* topilmadi. Printer USB ga ulanganmi?"
  exit 1
fi

echo "==> USB device: $DEVICE"

# Eski noto'g'ri printerlarni tozalash
sudo cancel -a 2>/dev/null || true
sudo lpadmin -x Unknown 2>/dev/null || true
sudo lpadmin -x "$PRINTER_NAME" 2>/dev/null || true

echo "==> CUPS: file backend (to'g'ridan-to'g'ri USB)"
sudo lpadmin -p "$PRINTER_NAME" -E \
  -v "file:$DEVICE" \
  -m raw \
  -o printer-is-shared=false

sudo lpoptions -d "$PRINTER_NAME"

echo ""
echo "==> Test ESC/POS:"
printf '\x1b@\x1ba\x01TEST CHEK\nMagazin 001\n\n\n\x1dV\x00' | sudo tee "$DEVICE" > /dev/null

echo ""
echo "Tayyor!"
echo "  docker-compose.yaml: THERMAL_PRINTER_DEVICE=$DEVICE"
echo "  THERMAL_PRINTER_NAME=$PRINTER_NAME"
