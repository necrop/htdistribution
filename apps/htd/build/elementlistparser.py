import csv
from collections import namedtuple

ElementSet = namedtuple('ElementSet', ['id', 'oed_id', 'label',
                                       'alphasort', 'type', 'year',
                                       'gender', 'markers', 'negators'])


def load_element_list(filepath):
    elements = []
    with open(filepath) as csvfile:
        csvreader = csv.reader(csvfile)
        for row in csvreader:
            j = ElementSet(id=int(row[0]),
                           oed_id=row[1],
                           label=row[2],
                           alphasort=row[3],
                           type=row[4],
                           year=row[5],
                           gender=row[6],
                           markers=set([r.strip() for r in row[7:] if
                                        r.strip() and
                                        not r.strip().startswith('-')]),
                           negators=set([r.strip('- ') for r in row[7:] if
                                         r.strip() and
                                         r.strip().startswith('-')]),)
            elements.append(j)
    return elements
