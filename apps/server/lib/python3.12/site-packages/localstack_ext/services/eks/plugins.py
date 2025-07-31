from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='k3d')
def k3d_package():from localstack_ext.services.eks.packages import k3d_package as A;return A