
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

# Path setup for project base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-*dd4pddegjt^lnflpd8p6p&oajn^dj&-k3u+)_s6_mpj*97u71")  # Use a strong secret key in production
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.TokenAuthentication',  # <-- Add this

    ]
}

# Media configuration for handling uploaded files
MEDIA_URL = '/media/'  # URL for media files
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')  # File system location for media files

# Templates setup
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # Optional: Add custom templates directory if needed
        'APP_DIRS': True,  # Automatically looks for templates in each app's 'templates' directory
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Installed applications
INSTALLED_APPS = [
    'django.contrib.admin',  # Django Admin
    'django.contrib.auth',  # Django authentication system
    'django.contrib.contenttypes',  # Django content types framework
    'django.contrib.sessions',  # Django sessions framework
    'django.contrib.messages',  # Django messages framework
    'django.contrib.staticfiles',  # Django static files management
    'rest_framework',  # Django Rest Framework for API support
    'corsheaders',  # Cross-Origin Resource Sharing headers
    'ration',  # Your custom app for ration management
    'rest_framework.authtoken',
]

# Middleware for security and other functionalities
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Root URL configuration
ROOT_URLCONF = 'backend.urls'

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # Using PostgreSQL
        'NAME': os.getenv('DB_NAME','ration_db'),  # Database name
        'USER': os.getenv('DB_USER','postgres'),  # Database user
        'PASSWORD': os.getenv('DB_PASSWORD','123'),  # Database password
        'HOST': os.getenv('DB_HOST','localhost'),  # Database host
        'PORT': os.getenv('DB_PORT','5432'),  # Default PostgreSQL port
    }
}

# Static files URL configuration
STATIC_URL = 'static/'

# Default auto field for models
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

  # Allow all origins during development
CORS_ALLOWED_ORIGINS = [
    "http://192.168.29.125:3000",
      "http://localhost:3000",  # React app running on this port (adjust as needed)
]
CORS_ALLOW_ALL_ORIGINS = True

# Email settings (For sending OTP emails)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Using Gmail's SMTP server for development
EMAIL_PORT = 587  # Gmail SMTP port
EMAIL_USE_TLS = True  # Enable TLS for secure email transmission
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'harimaxdp@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD','opph bxzi dyer rhxj')  # Your Gmail password (use a proper password or app password)
DEFAULT_FROM_EMAIL = 'harimaxdp@gmail.com'  # Sender email address

# Add static and media serving routes during development
from django.conf import settings
from django.conf.urls.static import static

# URLs configuration for serving media files during development
urlpatterns = [
    # Other URL patterns for your app can go here
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
