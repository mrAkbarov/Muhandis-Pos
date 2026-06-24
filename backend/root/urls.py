from django.conf import settings as django_settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from root import settings

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path("admin/", admin.site.urls),
    path("", include('apps.urls')),
]

if getattr(django_settings, 'ENABLE_SILK', False):
    urlpatterns += [path('silk/', include('silk.urls', namespace='silk'))]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)