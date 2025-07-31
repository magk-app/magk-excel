from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='neo4j')
def neo4j_package():from localstack_ext.services.neptune.packages import neo4j_package as A;return A
@pro_package(name='tinkerpop')
def tinkerpop_package():from localstack_ext.services.neptune.packages import tinkerpop_package as A;return A