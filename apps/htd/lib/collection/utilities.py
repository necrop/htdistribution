from ...models import Element, Collection


def build_idlist(post):
    ids = []
    for k in [k.replace('element_', '') for k in post.keys()
              if k.startswith('element_') and post[k] == 'on']:
        try:
            int(k)
        except ValueError:
            pass
        else:
            ids.append(k)
    if len(ids) > 1:
        return '-'.join(sorted(ids))
    else:
        return None


def save_collection(post):
    label = post.get('label') or 'unnamed'
    description = post.get('description', None)
    setname = post.get('setname', 'author')
    idlist = post.get('idlist', '')
    elements = collection_elements(idlist)
    if elements:
        setname = elements[0].elementtype
    collection = Collection(label=label,
                            description=description,
                            elementtype=setname)
    collection.alphasort = collection.compute_alphasort()
    collection.save()  # has to be saved once before elements can be added
    collection.elements = elements
    collection.save()  # ...then saved again with elements
    return collection


def collection_elements(idlist):
    """
    Retrieve the set of elements (as an alpha-sorted list) corresponding
    to a hyphen-separated string of IDs
    """
    ids = [int(id) for id in idlist.split('-')]
    elements = list(Element.objects.filter(id__in=ids))
    return elements


def update_collection(post):
    collection_id = int(post.get('id', 0))
    element_idlist = build_idlist(post)
    additions = [int(a) for a in post.getlist('additions')]

    collection = Collection.objects.get(id=collection_id)
    collection.label = post.get('label') or 'unnamed'
    collection.description = post.get('description') or None
    collection.alphasort = collection.compute_alphasort()
    collection.elements = collection_elements(element_idlist)

    for added_id in additions:
        try:
            element = Element.objects.get(id=added_id)
        except Element.DoesNotExist:
            pass
        else:
            collection.elements.add(element)

    collection.save()


def collection_json(elements):
    import json
    rows = [(element.id, element.label, element.stats) for element in elements]
    return json.dumps(rows)
