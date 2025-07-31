from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='kafka')
def kafka_package():from localstack_ext.services.kafka.packages import kafka_package as A;return A