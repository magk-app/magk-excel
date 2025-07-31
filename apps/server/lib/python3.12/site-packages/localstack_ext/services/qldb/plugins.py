from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='qldb')
def partiql_package():from localstack_ext.services.qldb.packages import partiql_package as A;return A