import os
from typing import List
from localstack.packages import DownloadInstaller,Package,PackageInstaller
from localstack_ext.constants import S3_ASSETS_BUCKET_URL
KAFKA_SERVER_URL=f"{S3_ASSETS_BUCKET_URL}/kafka-server-all-<version>.jar"
DEFAULT_VERSION=os.getenv('MSK_DEFAULT_KAFKA_VERSION','').strip()or'2.8.0'
VERSIONS=['2.8.0','3.1.0']
class KafkaPackage(Package):
	def __init__(A):super().__init__(name='Kafka',default_version=DEFAULT_VERSION)
	def get_versions(A):return VERSIONS
	def _get_installer(A,version):return KafkaPackageInstaller('kafka',version)
class KafkaPackageInstaller(DownloadInstaller):
	def _get_download_url(A):return KAFKA_SERVER_URL.replace('<version>',A.version)
kafka_package=KafkaPackage()