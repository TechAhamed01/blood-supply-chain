# config/settings/development.py

from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

# Development database can be sqlite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
