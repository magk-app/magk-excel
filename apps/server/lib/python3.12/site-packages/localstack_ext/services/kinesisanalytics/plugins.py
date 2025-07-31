from localstack.packages import Package
from localstack_ext.packages.core import pro_package
@pro_package(name='pysiddhi')
def pysiddhi_package():from localstack_ext.services.kinesisanalytics.packages import siddhi_package as A;return A