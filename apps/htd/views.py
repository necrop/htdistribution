from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404, HttpRequest
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse

from .models import Collection

base_url = '/projects/htd'


#=============================================================
# Home page, static pages, etc.
#=============================================================

def homepage(request):
    """
    Home page
    """
    params = {}
    return render(request, 'htd/home.html', _add_base_params(params, request))


def info(request, **kwargs):
    """
    Information page (help, about, etc.)
    """
    template_name = 'htd/info/%s.html' % kwargs.get('page')
    params = {}
    return render(request, template_name, _add_base_params(params, request))


#=============================================================
# Element listings and display
#=============================================================

def scatter(request, **kwargs):
    from .models import Element, ElementRawData
    element_id = int(kwargs.get('id', 0))
    try:
        element = Element.objects.get(id=element_id)
    except Element.DoesNotExist:
        element = None
    try:
        element_raw = ElementRawData.objects.get(id=element_id)
    except ElementRawData.DoesNotExist:
        data = '[]'
    else:
        data = element_raw.data
    if element and data:
        params = {'element': element, 'datapoints': data}
        return render(request, 'htd/element/scatter.html',
                      _add_base_params(params, request))
    else:
        params = {'id': element_id}
        return render(request, 'htd/element/element_not_found.html',
                      _add_base_params(params, request))


def histogram(request, **kwargs):
    from .models import Element
    element_id = int(kwargs.get('id', 0))
    try:
        element = Element.objects.get(id=element_id)
    except Element.DoesNotExist:
        element = None
    if element:
        params = {'element': element}
        return render(request, 'htd/element/histogram.html',
                      _add_base_params(params, request))
    else:
        params = {'id': element_id}
        return render(request, 'htd/element/element_not_found.html',
                      _add_base_params(params, request))


def sense(request, **kwargs):
    """
    Return JSON data representing a sense (identified by database ID):
    lemma, entry ID, lexid
    """
    import json
    from .models import Sense
    sense_id = int(kwargs.get('id'))
    try:
        sense_record = Sense.objects.get(id=sense_id)
    except Sense.DoesNotExist:
        data = ['', 0, 0]
    else:
        data = [sense_record.lemma, sense_record.entry, sense_record.lexid]
    response = json.dumps(data)
    return HttpResponse(response, content_type='text/plain')


def list_elements(request, **kwargs):
    from .models import Element
    from .lib.sorter import element_sorter
    elementtype = kwargs.get('elementtype') or 'author'
    elements = element_sorter(request, Element.objects.filter(elementtype=elementtype))
    params = {'elementtype': elementtype, 'elements': elements}
    return render(request, 'htd/element_list.html',
                  _add_base_params(params, request))


#=============================================================
# Search
#=============================================================

def search(request, **kwargs):
    from .lib.search import normalized_query
    if request.method == 'POST':
        post = request.POST.copy()
        query = normalized_query(post.get('query', ''))
        url = reverse('htd:searchresults', kwargs={'query': query})
    else:
        url = reverse('htd:home')
    return HttpResponseRedirect(url)


def search_results(request, **kwargs):
    from .lib.search import results
    query = kwargs.get('query')
    elements, collections = results(query)
    if len(elements) == 1 and not collections:
        return HttpResponseRedirect(elements[0].get_absolute_url())
    elif len(collections) == 1 and not elements:
        return HttpResponseRedirect(collections[0].get_absolute_url())
    else:
        res = {'elements': elements, 'collections': collections}
        params = {'query': query, 'results': res}
        return render(request, 'htd/results.html',
                      _add_base_params(params, request))


#=============================================================
# Taxonomy
#=============================================================

def taxonomy(request, **kwargs):
    from .models import ThesaurusClass
    thes_classes = sorted(ThesaurusClass.objects.filter(level__in=(1, 2, 3)),
                          key=lambda t: t.breadcrumb)
    params = {'classes': thes_classes}
    return render(request, 'htd/taxonomy.html',
                  _add_base_params(params, request))


#=============================================================
# Collections
#=============================================================

def collection_submit(request, **kwargs):
    from .lib.collection.utilities import build_idlist
    if request.method == 'POST':
        post = request.POST.copy()
        idlist = build_idlist(post)
        if idlist:
            url = reverse('htd:collectionanon', kwargs={'idlist': idlist})
        else:
            elementtype = post.get('elementtype')
            url = reverse('htd:collectionfail', kwargs={'elementtype': elementtype})
    else:
        url = reverse('htd:home')
    return HttpResponseRedirect(url)


def collection_fail(request, **kwargs):
    params = {'elementtype': kwargs.get('elementtype')}
    return render(request, 'htd/collection/fail.html',
                  _add_base_params(params, request))


def collection(request, **kwargs):
    from .lib.collection.utilities import collection_elements, collection_json
    from .lib.sorter import element_sorter
    idlist = kwargs.get('idlist')
    collection_id = kwargs.get('id')
    if idlist:
        coll = None
        elements = collection_elements(idlist)
    elif collection_id:
        coll = Collection.objects.get(id=collection_id)
        elements = coll.elements.all()
    else:
        elements = []

    if len(elements) > 1:
        view = request.GET.get('view') or 'list'
        elementtype = elements[0].elementtype
        idlist = '-'.join([str(e.id) for e in elements])
        elements = element_sorter(request, elements)

        params = {'elementtype': elementtype, 'elements': elements,
                  'idlist': idlist, 'collection': coll, 'view': view,
                  'jsondata': 0}
        params = _add_base_params(params, request)

        if view == 'list':
            return render(request, 'htd/collection/contents.html',
                          params)
        elif view == 'stack':
            params['jsondata'] = collection_json(elements)
            return render(request, 'htd/collection/collection_histogram.html',
                          params)
        elif view == 'detail':
            params['jsondata'] = collection_json(elements)
            return render(request, 'htd/collection/collection_detail.html',
                          params)
        else:
            return HttpResponseRedirect(reverse('htd:home'))

    else:
        # In case this is not a valid collection consisting of two or more
        # elements
        try:
            elementtype = elements[0].elementtype
        except IndexError:
            elementtype = 'author'
        url = reverse('htd:collectionfail', kwargs={'elementtype': elementtype})
        return HttpResponseRedirect(url)


def collection_manager(request, **kwargs):
    params = {'collections': Collection.objects.all()}
    return render(request, 'htd/collection/manage.html',
                  _add_base_params(params, request))


def collection_save(request, **kwargs):
    from .lib.collection.utilities import save_collection
    if request.method == 'POST':
        post = request.POST.copy()
        collection = save_collection(post)
        url = collection.get_absolute_url()
    else:
        url = reverse('htd:home')
    return HttpResponseRedirect(url)


def collection_update(request, **kwargs):
    from .lib.collection.utilities import update_collection
    if request.method == 'POST':
        post = request.POST.copy()
        update_collection(post)
        url = reverse('htd:collections')
    else:
        url = reverse('htd:home')
    return HttpResponseRedirect(url)


def collection_delete(request, **kwargs):
    id = kwargs.get('id')
    try:
        c = Collection.objects.get(id=id)
    except Collection.DoesNotExist:
        c = None
    if c:
        c.delete()
    url = reverse('htd:collections')
    return HttpResponseRedirect(url)




def _add_base_params(params, request):
    params['collections'] = Collection.objects.all()
    return params


"""
def element_display(request, **kwargs):
    from .models import Element
    from .lib.rankings import rankings
    id = kwargs.get('id')
    view = request.GET.get('view', 'stack2')
    try:
        element = Element.objects.get(id=id)
    except Element.DoesNotExist:
        element = None

    if element is not None:
        if view == 'tables':
            rank = rankings(element, clip=10, threshold=50)
        else:
            rank = None
        params = {'element': element, 'rankings': rank, 'view': view}
        return render(request, 'htd/element/element_base.html',
                      _add_base_params(params, request))
    else:
        params = {'id': id}
        return render(request, 'htd/element_not_found.html',
                      _add_base_params(params, request))



def plot(request, **kwargs):
    from .lib.collection.utilities import collection_elements
    type = kwargs.get('type')
    idlist = kwargs.get('idlist')
    if type == 'treescatter':
        from .models import Element
        from .lib.element.treemapscatter import TreemapScatter
        element = Element.objects.get(id=idlist)
        tm = TreemapScatter()
        return tm.draw_treemap(element)
    elif type == 'treestacksize2':
        from .lib.element.treemapstack import TreemapStack
        elements = collection_elements(idlist)
        tm = TreemapStack(labels3=False)
        return tm.draw_treemap(elements, level=2, mode='size')
    elif type == 'treestacksize3':
        from .lib.element.treemapstack import TreemapStack
        elements = collection_elements(idlist)
        tm = TreemapStack(labels3=True)
        return tm.draw_treemap(elements, level=3, mode='size')
    elif type == 'treestackshare2':
        from .lib.element.treemapstack import TreemapStack
        elements = collection_elements(idlist)
        tm = TreemapStack(labels3=False)
        return tm.draw_treemap(elements, level=2, mode='share')
    elif type == 'chistat2':
        from .lib.element.skewchart import SkewChart
        elements = collection_elements(idlist)
        sc = SkewChart()
        return sc.draw_skewchart(elements, level=2)
    elif type == 'chistat3':
        from .lib.element.skewchart import SkewChart
        elements = collection_elements(idlist)
        sc = SkewChart()
        return sc.draw_skewchart(elements, level=3)
    elif type == 'histogramdetail':
        from .lib.element.histogramdetail import HistogramDetail
        elements = collection_elements(idlist)
        thesclass_id = int(request.GET.get('class', 1))
        hd = HistogramDetail()
        return hd.draw_histogram(elements, thesclass_id)
"""
