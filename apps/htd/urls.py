from django.conf.urls import patterns, url

urlpatterns = patterns('apps.htd.views',
    url(r'^/?$', 'homepage', name='home'),
    url(r'^home$', 'homepage', name='home'),
    url(r'^info/(?P<page>[a-z]+)$', 'info', name='info'),

    url(r'^list/(?P<elementtype>[a-z]+)$', 'list_elements', name='list'),
    url(r'^(?P<sortcode>[a-z_]+)-scatter-(?P<id>[0-9]*)$', 'scatter', name='scatter'),
    url(r'^(?P<sortcode>[a-z_]+)-histogram-(?P<id>[0-9]*)$', 'histogram', name='histogram'),
    url(r'^sense/(?P<id>[0-9]*)$', 'sense', name='sense'),

    url(r'^taxonomy$', 'taxonomy', name='taxonomy'),

    url(r'^submitsearch$', 'search', name='submitsearch'),
    url(r'^searchresults/(?P<query>.*)$', 'search_results', name='searchresults'),

    url(r'^collection/(?P<id>\d+)-(?P<label>[a-z]*)$', 'collection', name='collection'),
    url(r'^collection/anon/(?P<idlist>.*)$', 'collection', name='collectionanon'),
    url(r'^collection/submit$', 'collection_submit', name='collectionsubmit'),
    url(r'^collection/fail/(?P<elementtype>[a-z]+)$', 'collection_fail', name='collectionfail'),
    url(r'^collection/save$', 'collection_save', name='collectionsave'),
    url(r'^collection/manage$', 'collection_manager', name='collections'),
    url(r'^collection/update$', 'collection_update', name='collectionupdate'),
    url(r'^collection/delete/(?P<id>\d+)$', 'collection_delete', name='collectiondelete'),

)
