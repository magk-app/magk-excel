from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='ecr')
def registry_package():from localstack_ext.services.ecr.packages import registry_package as A;return A