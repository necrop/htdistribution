
import os
from lxml import etree

from lex.oed.thesaurus.taxonomymanager import TaxonomyManager


def make_taxonomy_versions(out_dir):
    tm = TaxonomyManager(levels=4, verbosity='low', lazy=True)
    for i in (2, 3, 4):
        tree = etree.Element('thesaurus')
        for c in tm.classes:
            if c.level() <= i:
                tree.append(c.node)

        out_file = os.path.join(out_dir, 'level%d' % i, 'taxonomy.xml')
        with open(out_file, 'w') as filehandle:
            filehandle.write(etree.tounicode(tree, pretty_print=True))
