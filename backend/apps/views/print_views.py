from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.services.thermal_print import get_printer_name, print_receipt


@extend_schema(
    tags=['Sale'],
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'storeName': {'type': 'string'},
                'id': {'type': 'string'},
                'date': {'type': 'string'},
                'time': {'type': 'string'},
                'items': {'type': 'array'},
                'amount': {'type': 'number'},
                'method': {'type': 'string'},
                'cashier': {'type': 'string'},
                'itemCount': {'type': 'integer'},
            },
        },
    },
)
class PrintReceiptAPIView(APIView):
    """Termo printerga ESC/POS chek yuborish (brauzer PostScript emas)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        receipt = request.data
        if not receipt or not receipt.get('items'):
            return Response({'detail': "Chek ma'lumoti kerak"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = print_receipt(receipt)
        except FileNotFoundError:
            return Response(
                {'detail': "lp buyrug'i topilmadi. cups-client o'rnatilganmi?"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(
            {
                'detail': 'Chek printerga yuborildi',
                'method': result.get('method'),
                'target': result.get('target'),
            }
        )

    def get(self, request):
        return Response({'printer': get_printer_name()})
