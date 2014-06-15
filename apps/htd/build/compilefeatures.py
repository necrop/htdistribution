
import os
import csv

from lex.oed.thesaurus.treemap import load_csv_treemap
from lex.entryiterator import EntryIterator
from . import config as buildconfig
from .elementlistparser import load_element_list
from .lemmatokenizer import tokenize_lemma

FEATURES = buildconfig.FEATURES
FEATURESET_ROOT = buildconfig.FEATURESET_ROOT
TREEMAP_FILE = buildconfig.TREEMAP_COORDINATES
SENSES_FILE = buildconfig.SENSES_FILE


def compile_features():
    level4_nodes = load_level4_nodes()
    elements = {}
    for feature in FEATURES:
        directory = os.path.join(FEATURESET_ROOT, feature)
        elements_list = os.path.join(directory, 'elements.csv')
        elements[feature] = load_element_list(elements_list)

    matches = {feature: {} for feature in FEATURES}
    for feature in FEATURES:
        for element in elements[feature]:
            matches[feature][element.id] = []
    salient_senses = []

    sense_id = 0
    iterator = EntryIterator(dict_type='oed',
                             fix_ligatures=True,
                             #file_filter='oed_[R].xml',
                             verbosity='low')
    for entry in iterator.iterate():
        generic_language_matches = _test_languages(entry, elements['language'])
        entry.share_quotations()

        # Number all the senses (so that we know which is the first sense,
        #  which we need for the language feature), then pull out just
        #  those that have thesaurus links
        senses = entry.senses()
        for i, sense in enumerate(senses):
            sense.count = i
        senses = [s for s in senses if s.thesaurus_categories()]

        for sense in senses:
            thes_nodes = sense.thesaurus_nodes().intersection(level4_nodes)
            if not thes_nodes:
                continue

            local_matches = dict()
            local_matches['author'] = _test_authors(sense, elements['author'])
            local_matches['compound'] = _test_compounds(sense, entry, elements['compound'])
            local_matches['language'] = {}
            if (local_matches['author'] or
                    local_matches['compound'] or
                    (generic_language_matches and sense.count == 0)):
                sense_id += 1
                date = sense.date().start
                if sense.count == 0:
                    local_matches['language'] = {id: date for id in
                                                 generic_language_matches}
                local_matches['compound'] = {id: date for id in
                                             local_matches['compound']}
                for feature in FEATURES:
                    for element_id, date in local_matches[feature].items():
                        for node in thes_nodes:
                            matches[feature][element_id].append((sense_id,
                                                                 date,
                                                                 node))

                salient_senses.append((sense_id,
                                       entry.id,
                                       sense.lexid(),
                                       sense.lemma))

    # Print a csv file for each element in each featureset; the file
    #  is a list of all the matching senses
    for feature, elements in matches.items():
        for element_id, localmatches in elements.items():
            out_file = os.path.join(FEATURESET_ROOT,
                                    feature,
                                    'raw',
                                    '%d.csv' % element_id)
            with open(out_file, 'w') as csvfile:
                csvwriter = csv.writer(csvfile)
                for match in localmatches:
                    csvwriter.writerow(match)

    # Print list of all the salient senses (those which are linked
    #  from at least one match in one of the featuresets)
    with open(SENSES_FILE, 'w') as csvfile:
        csvwriter = csv.writer(csvfile)
        for sense in salient_senses:
            csvwriter.writerow(sense)


#==============================================
# Methods for collecting data points from OED entries
# (invoked by compile_data())
#==============================================

def _test_authors(sense, elements):
    matches = {}
    for qp in sense.quotation_paragraphs():
        for element in elements:
            match = qp.contains_quote_from(author=element.markers)
            if match:
                matches[element.id] = match.year()
    return matches


def _test_languages(entry, elements):
    languages = entry.characteristic_nodes('etymonLanguage')

    # find the subset of elements whose markers occur in the languages set
    matches = [element.id for element in elements if
               element.markers.intersection(languages) and
               not element.negators.intersection(languages)]
    return set(matches)


def _test_compounds(sense, entry, elements):
    matches = set()
    word1, word2 = tokenize_lemma(sense.lemma,
                                  entry.headword,
                                  sense.subentry_type(),
                                  entry.etymology().etyma_lemmas())
    if word1 and word2:
        tokens = {word1.lower(), word2.lower()}
        for element in elements:
            if element.markers.intersection(tokens):
                matches.add(element.id)
    return matches


def load_level4_nodes():
    nodes = load_csv_treemap(TREEMAP_FILE)
    return set([n.id for n in nodes if n.level == 4])
