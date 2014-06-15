"""
Management wrapper for running database build processes
"""

from django.core.management.base import BaseCommand
from apps.htd.build.pipeline import dispatch


class Command(BaseCommand):
    help = 'Run database build processes for HT Distribution'

    def handle(self, *args, **options):
        dispatch()
