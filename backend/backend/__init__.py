# File: backend/__init__.py
from __future__ import absolute_import, unicode_literals

# Django starts
from .celery import app as celery_app

__all__ = ('celery_app',)