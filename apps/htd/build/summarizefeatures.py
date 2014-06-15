
import os
import csv
from collections import defaultdict

from lex.oed.thesaurus.taxonomymanager import TaxonomyManager
from lex.oed.thesaurus.treemap import load_csv_treemap
from . import config as buildconfig

FEATURES = buildconfig.FEATURES
FEATURESET_ROOT = buildconfig.FEATURESET_ROOT
TAXONOMY_DIR = os.path.join(buildconfig.TAXONOMY_VERSIONS_DIR, 'level4')
TREEMAP_FILE = buildconfig.TREEMAP_COORDINATES


def summarize_features():
    level2nodes = load_level2_nodes()

    tm = TaxonomyManager(dir=TAXONOMY_DIR, levels=4, verbosity='low',
                         lazy=False)
    level2classes = [c for c in tm.classes if c.level() == 2 and
                     c.id() in level2nodes]
    descendants = {}
    for parent in level2classes:
        desc = tm.descendants_of(parent.id())
        descendants[parent.id()] = set([c.id() for c in desc
                                        if c.level() == 4])

    for feature in FEATURES:
        in_dir = os.path.join(FEATURESET_ROOT, feature, 'raw')
        out_dir = os.path.join(FEATURESET_ROOT, feature, 'summarized')
        files = [f for f in os.listdir(in_dir) if f.endswith('.csv')]
        for filename in files:
            #print(filename)
            #element_id = int(filename.split('.')[0])

            # Load up the list of thesaurus nodes from this element's
            #  raw .csv file
            in_file = os.path.join(in_dir, filename)
            nodes = defaultdict(int)
            with open(in_file) as csvfile:
                csvreader = csv.reader(csvfile)
                for row in csvreader:
                    thesaurus_node = int(row[2])
                    nodes[thesaurus_node] += 1

            total = sum(nodes.values()) or 1

            level2_counts = {}
            for id, desc in descendants.items():
                level2_counts[id] = 0
                for node, count in nodes.items():
                    if node in desc:
                        level2_counts[id] += count

            out_file = os.path.join(out_dir, filename)
            with open(out_file, 'w') as csvfile:
                csvwriter = csv.writer(csvfile)
                for id in sorted(level2_counts.keys()):
                    ratio = level2_counts[id] / total
                    ratio = float('%.3g' % ratio)
                    row = [id, level2_counts[id], ratio,]
                    csvwriter.writerow(row)


def load_level2_nodes():
    nodes = load_csv_treemap(TREEMAP_FILE)
    return set([n.id for n in nodes if n.level == 2])
