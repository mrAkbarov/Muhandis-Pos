from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from apps.views import BranchModelViewSet, RegisterModelViewSet, LoginAPIView

api_router = SimpleRouter(trailing_slash=False)
api_router.register('branch', BranchModelViewSet)

auth_router = SimpleRouter(trailing_slash=False)
auth_router.register('register', RegisterModelViewSet, basename='auth-register')

urlpatterns = [
    path('api/v1/', include([
        path('', include(api_router.urls)),
        path('token', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    path('auth/', include([
        path('', include(auth_router.urls)),
        path('login/', LoginAPIView.as_view()),
    ]))
]
