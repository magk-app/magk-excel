from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='amazon-mq')
def active_mq_package():from localstack_ext.services.mq.packages import active_mq_package as A;return A