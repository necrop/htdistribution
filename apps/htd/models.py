import re
from unidecode import unidecode

from django.db import models
from django.core.urlresolvers import reverse

from jsonfield import JSONField


oed_baseurl = 'http://www.oed.com/'
element_types = [(t, t) for t in ('author', 'language', 'compound')]


class Sense(models.Model):
    lemma = models.CharField(max_length=100)
    entry = models.IntegerField()
    lexid = models.IntegerField()


class ThesaurusClass(models.Model):
    label = models.CharField(max_length=100)
    level = models.IntegerField(db_index=True)
    root = models.IntegerField()
    sort = models.IntegerField()
    size = models.IntegerField()
    ratio = models.FloatField()
    x = models.FloatField()
    y = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    breadcrumb = models.CharField(max_length=300)

    class Meta:
        ordering = ['sort',]

    def __str__(self):
        return '%s (%d)' % (self.breadcrumb, self.id)

    def oed_url(self):
        template = '%sview/th/class/%d'
        return template % (oed_baseurl, self.id)

    def indent(self):
        return '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' * self.level


class Element(models.Model):
    alphasort = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, null=True)
    year = models.IntegerField(null=True)
    elementtype = models.CharField(max_length=20, choices=element_types, db_index=True)
    oedidentifier = models.CharField(max_length=50)
    size = models.IntegerField()
    stats = JSONField()

    class Meta:
        ordering = ['alphasort',]

    def __str__(self):
        return '%s (#%d)' % (self.label, self.id)

    def get_absolute_url(self):
        return reverse('htd:scatter', kwargs={'id': str(self.id),
                                              'sortcode': self.alphasort.lower()})

    def oed_url(self):
        if self.elementtype in ('author', 'title'):
            template = '%sview/source/%s'
        elif self.elementtype == 'language':
            template = '%ssearch?scope=SENSE&langClass=%s'
        elif self.elementtype == 'compound':
            template = '%sview/Entry/%s'
        return template % (oed_baseurl, self.oedidentifier)


class ElementRawData(models.Model):
    data = JSONField()


class Collection(models.Model):
    label = models.CharField(max_length=100)
    alphasort = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    elementtype = models.CharField(max_length=20, choices=element_types)
    elements = models.ManyToManyField(Element)

    def __str__(self):
        return '%s (%s)' % (self.label, self.elementtype)

    class Meta:
        ordering = ['alphasort',]

    def get_absolute_url(self):
        return reverse('htd:collection', kwargs={'id': str(self.id),
                                                 'label': self.alphasort})

    def compute_alphasort(self):
        alpha = unidecode(self.label.lower())
        alpha = re.sub(r'[^a-z0-9]', '', alpha)
        return alpha

    def complement(self):
        element_ids = set([e.id for e in self.elements.all()])
        return Element.objects.filter(elementtype=self.elementtype).\
            exclude(id__in=element_ids)

    def members(self):
        return ', '.join([e.label for e in self.elements.all()])

