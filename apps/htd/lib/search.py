from django.db.models import Q
from ..models import Element, Collection


def normalized_query(query):
    query = query.strip().lower().replace('  ', ' ')
    return query


def results(query):
    if not query:
        return [], []
    else:
        elements = Element.objects.filter(Q(label__icontains=query) |
            Q(alphasort__icontains=query))
        collections = Collection.objects.filter(Q(label__icontains=query) |
            Q(alphasort__icontains=query))
        return elements, collections
