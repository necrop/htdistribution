import os

from . import config as buildconfig


def dispatch():
    for function_name, run in buildconfig.PIPELINE:
        if run:
            print('=' * 30)
            print('Running "%s"...' % function_name)
            print('=' * 30)
            fn = globals()[function_name]
            fn()


def build_taxonomy_versions():
    from .taxonomyversioner import make_taxonomy_versions
    make_taxonomy_versions(buildconfig.TAXONOMY_VERSIONS_DIR)


def compile_treemap_data():
    from lex.oed.thesaurus.treemap import Treemap
    tmb = Treemap()
    tmb.write_to_csv(out_file=buildconfig.TREEMAP_COORDINATES)
    tmb.write_to_json(out_file=buildconfig.TREEMAP_JSON,
                      omit_breadcrumb=False,
                      omit_label=True)


def compile_feature_data():
    from .compilefeatures import compile_features
    compile_features()


def summarize():
    from .summarizefeatures import summarize_features
    summarize_features()


def populate_database():
    from .populatedatabase import populate_database
    populate_database()
