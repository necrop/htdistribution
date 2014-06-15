import os
from lex import lexconfig

PIPELINE = [
    ('build_taxonomy_versions', 0),
    ('compile_treemap_data', 1),
    ('compile_feature_data', 0),
    ('summarize', 0),
    ('populate_database', 0),
]

FEATURES = ('author', 'language', 'compound')

PROJECT_ROOT = os.path.join(lexconfig.OED_PROJECTS_DIR, 'htdistribution')
TAXONOMY_VERSIONS_DIR = os.path.join(PROJECT_ROOT, 'taxonomy_versions')
FEATURESET_ROOT = os.path.join(PROJECT_ROOT, 'featuresets')
TREEMAP_COORDINATES = os.path.join(PROJECT_ROOT, 'treemap_coordinates.csv')
TREEMAP_JSON = os.path.join(PROJECT_ROOT, 'treemap_raw.js')
SENSES_FILE = os.path.join(PROJECT_ROOT, 'senses', 'senses.csv')

# Maximum number of datapoints to be displayed in a scatter chart
MAX_DATAPOINTS = 1000
