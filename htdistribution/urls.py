from django.conf.urls import patterns, include, url
from django.contrib.auth.views import login, logout
from django.contrib import admin

from apps.root.views import homepage


urlpatterns = patterns('',
    url(r'^$', homepage),
    url(r'^home/?$', homepage),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/login/$', login, name='login'),
    url(r'^accounts/logout/$', logout, name='logout'),
    url(r'^r/', include('apps.htd.urls', namespace='htd', app_name='htd')),
)
