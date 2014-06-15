import os
import csv
import random
import json

from lex.oed.thesaurus.treemap import load_csv_treemap
from . import config as buildconfig
from .elementlistparser import load_element_list
from apps.htd.models import Sense, Element, ElementRawData, ThesaurusClass

FEATURES = buildconfig.FEATURES
FEATURESET_ROOT = buildconfig.FEATURESET_ROOT
TREEMAP_FILE = buildconfig.TREEMAP_COORDINATES
SENSES_FILE = buildconfig.SENSES_FILE
MAX_DATAPOINTS = buildconfig.MAX_DATAPOINTS


def populate_database():
    # Clear out the existing database
    Element.objects.all().delete()
    Sense.objects.all().delete()
    ThesaurusClass.objects.all().delete()
    # Repopulate
    print('Populating thesaurus...')
    populate_thesaurus()
    print('Populating senses...')
    populate_senses()
    print('Populating elements...')
    populate_elements()
    print('Populating elements raw data...')
    populate_raw_data()


def populate_thesaurus():
    nodes = load_csv_treemap(TREEMAP_FILE)
    rows = []
    for node in nodes:
        row = ThesaurusClass(id=node.id,
                             root=node.root,
                             label=node.label[:100],
                             level=node.level,
                             size=node.size,
                             ratio=node.ratio,
                             x=node.x,
                             y=node.y,
                             width=node.w,
                             height=node.h,
                             sort=node.sort,
                             breadcrumb=node.breadcrumb[:300])
        rows.append(row)
    ThesaurusClass.objects.bulk_create(rows)


def populate_senses():
    rows = []
    with open(SENSES_FILE) as filehandle:
        csvreader = csv.reader(filehandle)
        for row in csvreader:
            id = int(row[0])
            entry = int(row[1])
            lexid = int(row[2])
            lemma = row[3]
            row = Sense(id=id,
                        entry=entry,
                        lexid=lexid,
                        lemma=lemma[:100])
            rows.append(row)
    Sense.objects.bulk_create(rows)


def populate_elements():
    rows = []
    for feature in FEATURES:
        in_file = os.path.join(FEATURESET_ROOT, feature, 'elements.csv')
        elements = load_element_list(in_file)
        for element in elements:
            data = load_stats(feature, element.id)
            size = sum([d[1] for d in data])
            row = Element(id=element.id,
                          oedidentifier=element.oed_id,
                          label=element.label[:100],
                          alphasort=element.alphasort[:100].lower(),
                          elementtype=element.type,
                          year=element.year or None,
                          gender=element.gender or None,
                          size=size,
                          stats=json.dumps(data),)
            rows.append(row)
    Element.objects.bulk_create(rows)


def populate_raw_data():
    for feature in FEATURES:
        in_dir = os.path.join(FEATURESET_ROOT, feature, 'raw')
        files = [f for f in os.listdir(in_dir) if f.endswith('.csv')]
        rows = []
        for filename in files:
            element_id = int(filename.split('.')[0])
            data = []
            with open(os.path.join(in_dir, filename)) as filehandle:
                csvreader = csv.reader(filehandle)
                for row in csvreader:
                    data.append([int(r) for r in row])
            if len(data) > MAX_DATAPOINTS:
                data = random.sample(data, MAX_DATAPOINTS)
            data.sort(key=lambda d: d[1])
            row = ElementRawData(id=element_id,
                                 data=json.dumps(data))
            rows.append(row)
        ElementRawData.objects.bulk_create(rows)


def load_stats(feature, element_id):
    in_file = os.path.join(FEATURESET_ROOT, feature, 'summarized',
                           '%d.csv' % element_id)
    rows = []
    with open(in_file) as filehandle:
        csvreader = csv.reader(filehandle)
        for row in csvreader:
            row = [int(row[0]), int(row[1]), float(row[2])]
            rows.append(row)
    return rows
