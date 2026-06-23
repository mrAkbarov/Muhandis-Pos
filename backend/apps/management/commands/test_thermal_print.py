from django.core.management.base import BaseCommand

from apps.services.thermal_print import format_receipt_escpos, get_printer_name, print_receipt


class Command(BaseCommand):
    help = 'Termo printerga test chek chop etish (ESC/POS raw)'

    def add_arguments(self, parser):
        parser.add_argument('--printer', default=None)

    def handle(self, *args, **options):
        receipt = {
            'storeName': 'Magazin 001',
            'id': 'TEST-001',
            'date': '22/06/26',
            'time': '19:50',
            'items': [
                {'name': 'Cola 1L', 'qty': 2, 'price': 10000},
                {'name': 'Non', 'qty': 1, 'price': 5000},
            ],
            'amount': 25000,
            'method': 'Naqd',
            'cashier': 'Kassir',
            'itemCount': 3,
        }
        printer = options['printer'] or get_printer_name()
        self.stdout.write(f'Printer: {printer}, hajm: {len(format_receipt_escpos(receipt))} bayt')
        result = print_receipt(receipt, printer_name=printer)
        self.stdout.write(self.style.SUCCESS(f"Test chek yuborildi: {result['method']} -> {result['target']}"))
