from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='redis')
def redis_package():from.packages import redis_package as A;return A