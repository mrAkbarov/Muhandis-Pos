from drf_spectacular.utils import extend_schema
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from apps.models import User
from serializers.auth_serializers import LoginModelSerializer, RegisterModelSerializer


@extend_schema(tags=['Auth'])
class RegisterModelViewSet(CreateModelMixin, GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterModelSerializer
    permission_classes = [AllowAny]


@extend_schema(tags=['Auth'])
class LoginAPIView(GenericAPIView):
    serializer_class = LoginModelSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'phone': user.phone,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
