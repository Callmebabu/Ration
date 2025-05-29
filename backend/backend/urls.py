from django.contrib import admin
from django.urls import path, include
from ration import views  # Importing views from the 'ration' app
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def home(request):
    return HttpResponse("Welcome to the Ration API backend!")
urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    # Main app endpoints
    path('api/', include('ration.urls')),

    # Direct path for admin password change (if not in ration/urls.py)
    path('api/admin/change-password/', views.change_admin_password),

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
