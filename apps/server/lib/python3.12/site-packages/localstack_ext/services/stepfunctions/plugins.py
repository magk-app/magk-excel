from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='stepfunctions')
def stepfunctions_package():from localstack_ext.services.stepfunctions.packages import stepfunctions_pro_package as A;return A